import json
import logging
import math
import os
import shutil
import tempfile
import threading
import time
from functools import lru_cache

import cv2
from PyQt6.QtCore import (
    QEasingCurve,
    QEvent,
    QObject,
    QPropertyAnimation,
    QRect,
    QSize,
    Qt,
    QThread,
    QTimer,
    pyqtSignal,
)
from PyQt6.QtGui import (
    QColor,
    QFont,
    QIcon,
    QImage,
    QKeySequence,
    QPainter,
    QPixmap,
    QShortcut,
)
from PyQt6.QtWidgets import (
    QAbstractItemView,
    QCheckBox,
    QComboBox,
    QDialog,
    QDoubleSpinBox,
    QFileDialog,
    QFormLayout,
    QFrame,
    QGraphicsDropShadowEffect,
    QGraphicsOpacityEffect,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QListWidget,
    QListWidgetItem,
    QMainWindow,
    QProgressBar,
    QPushButton,
    QScrollArea,
    QSpinBox,
    QSplitter,
    QStatusBar,
    QStyledItemDelegate,
    QToolButton,
    QVBoxLayout,
    QWidget,
)

from exporter import export_video
from ml_engine import MLEngine, preload_model_async
from video_processor import detect_scenes_and_extract_frames

logger = logging.getLogger(__name__)


class _UiBridge(QObject):
    """Marshal background-thread callbacks onto the Qt UI thread."""

    status = pyqtSignal(str)


# SpotiFLAC-inspired soft accents
CLUSTER_COLORS = [
    "#22c55e",
    "#4ade80",
    "#86efac",
    "#16a34a",
    "#15803d",
    "#34d399",
    "#2dd4bf",
    "#38bdf8",
    "#a78bfa",
    "#f472b6",
]


def _shadow(blur=24, dy=6, alpha=80):
    eff = QGraphicsDropShadowEffect()
    eff.setBlurRadius(blur)
    eff.setOffset(0, dy)
    eff.setColor(QColor(0, 0, 0, alpha))
    return eff


def fade_in(widget, duration=280, delay=0):
    """Opacity 0→1 ease-out. Keeps a ref on the widget to avoid GC."""
    effect = QGraphicsOpacityEffect(widget)
    widget.setGraphicsEffect(effect)
    effect.setOpacity(0.0)
    anim = QPropertyAnimation(effect, b"opacity", widget)
    anim.setDuration(duration)
    anim.setStartValue(0.0)
    anim.setEndValue(1.0)
    anim.setEasingCurve(QEasingCurve.Type.OutCubic)
    if delay:
        QTimer.singleShot(delay, anim.start)
    else:
        anim.start()
    widget._fade_anim = anim
    return anim


@lru_cache(maxsize=2)
def get_stylesheet(is_dark_mode: bool) -> str:
    """SpotiFLAC-inspired soft dark cards, green primary, rounded chrome."""
    if is_dark_mode:
        bg = "#121212"
        panel = "#181818"
        elevated = "#242424"
        hover = "#2a2a2a"
        border = "#2a2a2a"
        input_border = "#333333"
        text = "#fafafa"
        muted = "#a1a1aa"
        primary = "#22c55e"
        primary_hi = "#4ade80"
        primary_text = "#052e16"
        danger = "#ef4444"
        scroll = "#3f3f46"
        font = '"Segoe UI", "Google Sans", system-ui, sans-serif'
    else:
        bg = "#fafafa"
        panel = "#ffffff"
        elevated = "#f4f4f5"
        hover = "#e4e4e7"
        border = "#e4e4e7"
        input_border = "#d4d4d8"
        text = "#18181b"
        muted = "#71717a"
        primary = "#16a34a"
        primary_hi = "#22c55e"
        primary_text = "#ffffff"
        danger = "#dc2626"
        scroll = "#a1a1aa"
        font = '"Segoe UI", "Google Sans", system-ui, sans-serif'

    return f"""
        QMainWindow, QDialog {{
            background-color: {bg};
        }}
        QWidget {{
            font-family: {font};
            color: {text};
            font-size: 13px;
        }}
        #Sidebar {{
            background-color: {panel};
            border-right: 1px solid {border};
        }}
        QToolButton#NavBtn {{
            background: transparent;
            border: none;
            border-radius: 10px;
            color: {muted};
            padding: 0;
            min-width: 40px; max-width: 40px;
            min-height: 40px; max-height: 40px;
            font-size: 16px;
        }}
        QToolButton#NavBtn:hover {{
            background-color: rgba(34, 197, 94, 0.12);
            color: {primary};
        }}
        QToolButton#NavBtn[active="true"] {{
            background-color: rgba(34, 197, 94, 0.18);
            color: {primary};
        }}
        #ContentRoot {{ background-color: {bg}; }}
        #HeroTitle {{
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
            color: {text};
        }}
        #HeroSub {{ color: {muted}; font-size: 13px; }}
        #VersionBadge {{
            background-color: {primary};
            color: {primary_text};
            border-radius: 999px;
            padding: 3px 10px;
            font-size: 11px;
            font-weight: 700;
        }}
        #Toolbar, #PanelFrame {{
            background-color: {panel};
            border: 1px solid {border};
            border-radius: 14px;
        }}
        #PanelTitle {{
            color: {text};
            font-size: 13px;
            font-weight: 700;
        }}
        #PanelMeta {{ color: {muted}; font-size: 12px; }}
        QPushButton {{
            padding: 8px 16px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 12px;
        }}
        QPushButton#PrimaryButton {{
            background-color: {primary};
            color: {primary_text};
            border: 1px solid {primary};
        }}
        QPushButton#PrimaryButton:hover {{
            background-color: {primary_hi};
            border-color: {primary_hi};
        }}
        QPushButton#PrimaryButton:disabled {{
            background-color: {elevated};
            color: {muted};
            border: 1px solid {input_border};
        }}
        QPushButton#SecondaryButton, QPushButton#SettingsButton, QPushButton#GhostButton {{
            background-color: {elevated};
            color: {text};
            border: 1px solid {input_border};
        }}
        QPushButton#SecondaryButton:hover, QPushButton#SettingsButton:hover, QPushButton#GhostButton:hover {{
            background-color: {hover};
            border: 1px solid {primary};
            color: {primary};
        }}
        QPushButton#SecondaryButton:disabled, QPushButton#GhostButton:disabled {{
            background-color: {panel};
            color: {muted};
            border: 1px solid {border};
        }}
        QPushButton#DangerButton {{
            background-color: transparent;
            color: {danger};
            border: 1px solid {input_border};
        }}
        QPushButton#DangerButton:hover {{
            border-color: {danger};
            background-color: rgba(239, 68, 68, 0.12);
        }}
        QProgressBar {{
            border: none;
            background-color: {elevated};
            border-radius: 6px;
            max-height: 8px; min-height: 8px;
        }}
        QProgressBar::chunk {{
            background-color: {primary};
            border-radius: 6px;
        }}
        QListWidget {{
            background-color: {bg};
            border: 1px solid {border};
            border-radius: 12px;
            padding: 8px;
            outline: none;
        }}
        QListWidget::item {{
            padding: 10px;
            padding-right: 56px;
            background-color: {panel};
            border: 1px solid {border};
            border-radius: 10px;
            margin-bottom: 6px;
            color: {text};
            font-size: 12px;
        }}
        QListWidget::item:selected {{
            border: 1px solid {primary};
            background-color: rgba(34, 197, 94, 0.10);
        }}
        QListWidget::item:hover {{ border-color: {primary}; }}
        QScrollArea {{ border: none; background-color: transparent; }}
        QScrollBar:vertical {{
            background: transparent; width: 8px; margin: 2px;
        }}
        QScrollBar::handle:vertical {{
            background: {scroll}; border-radius: 4px; min-height: 28px;
        }}
        QScrollBar::handle:vertical:hover {{ background: {primary}; }}
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0; }}
        QSplitter::handle {{ background-color: transparent; height: 8px; }}
        QStatusBar {{
            background-color: {panel};
            color: {muted};
            border-top: 1px solid {border};
            font-size: 12px;
        }}
        SceneThumbnail {{
            background-color: {panel};
            border: 1px solid {input_border};
            border-radius: 12px;
        }}
        SceneThumbnail:hover {{
            border: 1px solid {primary};
            background-color: {elevated};
        }}
        QDoubleSpinBox, QSpinBox, QComboBox {{
            background-color: {bg};
            border: 1px solid {input_border};
            border-radius: 10px;
            padding: 6px 10px;
            color: {text};
            min-height: 18px;
        }}
        QComboBox::drop-down {{ border: none; width: 20px; }}
        QComboBox QAbstractItemView {{
            background: {panel};
            color: {text};
            selection-background-color: rgba(34, 197, 94, 0.25);
            border: 1px solid {border};
            border-radius: 8px;
        }}
        QCheckBox {{ color: {text}; spacing: 8px; }}
        QCheckBox::indicator {{
            width: 16px; height: 16px;
            border-radius: 4px;
            border: 1px solid {input_border};
            background: {bg};
        }}
        QCheckBox::indicator:checked {{
            background: {primary};
            border-color: {primary};
        }}
        #ClusterChip {{
            background-color: {elevated};
            border: 1px solid {input_border};
            border-radius: 999px;
            padding: 5px 12px;
            color: {text};
            font-size: 11px;
            font-weight: 600;
        }}
        #ClusterChip:hover {{
            border-color: {primary};
            color: {primary};
            background-color: rgba(34, 197, 94, 0.10);
        }}
        #DurationPill {{
            background-color: rgba(34, 197, 94, 0.12);
            border: 1px solid rgba(34, 197, 94, 0.35);
            border-radius: 999px;
            padding: 5px 12px;
            color: {primary};
            font-weight: 700;
            font-size: 12px;
        }}
        #PulseDot {{
            background-color: {primary};
            border-radius: 5px;
            min-width: 10px; max-width: 10px;
            min-height: 10px; max-height: 10px;
        }}
        #DropHint {{
            color: {muted};
            font-size: 14px;
            border: 2px dashed {input_border};
            border-radius: 16px;
            padding: 40px;
            background-color: {panel};
        }}
    """


class PremiumNotification(QDialog):
    def __init__(self, title, message, is_error=False, parent=None, is_dark_mode=True):
        super().__init__(parent)
        self.setWindowTitle(title)
        self.setFixedSize(420, 210)
        self.setWindowFlags(Qt.WindowType.Dialog | Qt.WindowType.FramelessWindowHint)
        self.setStyleSheet(get_stylesheet(is_dark_mode))

        layout = QVBoxLayout(self)
        layout.setContentsMargins(28, 28, 28, 28)
        layout.setSpacing(14)

        accent = "#ff4d6d" if is_error else "#22c55e"
        title_label = QLabel(title)
        title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title_label.setStyleSheet(f"color: {accent}; font-size: 13px; font-weight: 700; letter-spacing: 2px;")
        layout.addWidget(title_label)

        msg_label = QLabel(message)
        msg_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        msg_label.setWordWrap(True)
        msg_label.setStyleSheet("color: #a1a1aa; font-size: 12px;")
        layout.addWidget(msg_label)

        btn_layout = QHBoxLayout()
        ok_btn = QPushButton("OK")
        ok_btn.setObjectName("PrimaryButton")
        ok_btn.clicked.connect(self.accept)
        btn_layout.addStretch()
        btn_layout.addWidget(ok_btn)
        btn_layout.addStretch()
        layout.addLayout(btn_layout)


class SettingsDialog(QDialog):
    def __init__(self, parent=None, is_dark_mode=True, eps=0.35, min_samples=2, accurate_export=False):
        super().__init__(parent)
        self.setWindowTitle("Settings")
        self.setFixedSize(380, 300)
        self.is_dark = is_dark_mode
        self.setStyleSheet(get_stylesheet(is_dark_mode))

        layout = QFormLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(14)

        self.theme_combo = QComboBox()
        self.theme_combo.addItems(["Spoti Dark", "Light"])
        self.theme_combo.setCurrentIndex(0 if is_dark_mode else 1)
        layout.addRow("Theme", self.theme_combo)

        self.eps_spin = QDoubleSpinBox()
        self.eps_spin.setRange(0.05, 2.0)
        self.eps_spin.setSingleStep(0.05)
        self.eps_spin.setValue(eps)
        self.eps_spin.setDecimals(2)
        self.eps_spin.setToolTip("Cosine DBSCAN neighborhood radius. Lower = tighter clusters.")
        layout.addRow("Cluster epsilon", self.eps_spin)

        self.min_samples_spin = QSpinBox()
        self.min_samples_spin.setRange(1, 20)
        self.min_samples_spin.setValue(min_samples)
        layout.addRow("Min samples", self.min_samples_spin)

        self.accurate_check = QCheckBox("Accurate export (re-encode cuts)")
        self.accurate_check.setChecked(accurate_export)
        layout.addRow("", self.accurate_check)

        hint = QLabel("Apply re-clusters instantly if embeddings are cached.")
        hint.setStyleSheet("color: #94a3b8; font-size: 11px;")
        hint.setWordWrap(True)
        layout.addRow(hint)

        btn_layout = QHBoxLayout()
        close_btn = QPushButton("Cancel")
        close_btn.setObjectName("SecondaryButton")
        close_btn.clicked.connect(self.reject)
        apply_btn = QPushButton("Apply")
        apply_btn.setObjectName("PrimaryButton")
        apply_btn.clicked.connect(self.apply_settings)
        btn_layout.addStretch()
        btn_layout.addWidget(close_btn)
        btn_layout.addWidget(apply_btn)
        layout.addRow(btn_layout)

    def apply_settings(self):
        self.is_dark = self.theme_combo.currentIndex() == 0
        self.accept()


class PreviewWorker(QThread):
    frame_ready = pyqtSignal(QPixmap)
    PREVIEW_FPS_CAP = 15.0

    def __init__(self, video_path, start_time, duration):
        super().__init__()
        self.video_path = video_path
        self.start_time = start_time
        self.duration = duration
        self.running = True

    def run(self):
        try:
            cap = cv2.VideoCapture(self.video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            if fps <= 0 or math.isnan(fps):
                fps = 30.0
            fps = min(fps, self.PREVIEW_FPS_CAP)
            # Prefer time seek for accuracy
            cap.set(cv2.CAP_PROP_POS_MSEC, self.start_time * 1000.0)
            max_frames = int(min(3.0, max(0.2, self.duration)) * fps)
            for _ in range(max_frames):
                if not self.running:
                    break
                ret, frame = cap.read()
                if not ret:
                    break
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                h, w, ch = frame.shape
                qt_img = QImage(frame.data, w, h, ch * w, QImage.Format.Format_RGB888).copy()
                pixmap = QPixmap.fromImage(qt_img).scaled(
                    168, 94, Qt.AspectRatioMode.KeepAspectRatio,
                    Qt.TransformationMode.SmoothTransformation,
                )
                self.frame_ready.emit(pixmap)
                time.sleep(1.0 / fps)
            cap.release()
        except Exception:
            logger.warning("PreviewWorker crashed", exc_info=True)


class AnalysisWorker(QThread):
    progress_updated = pyqtSignal(int, str)
    finished_analysis = pyqtSignal(list)
    error_occurred = pyqtSignal(str)

    def __init__(self, video_path, ml_engine: MLEngine, eps=0.35, min_samples=2):
        super().__init__()
        self.video_path = video_path
        self.eps = eps
        self.min_samples = min_samples
        self.ml_engine = ml_engine
        self._cancel = threading.Event()

    def cancel(self):
        self._cancel.set()

    def run(self):
        try:
            temp_dir = os.path.join(tempfile.gettempdir(), "video_classifier_frames")

            def p_callback(val, msg):
                self.progress_updated.emit(val, msg)

            scenes, error = detect_scenes_and_extract_frames(
                self.video_path, temp_dir, p_callback, cancel_event=self._cancel
            )
            if self._cancel.is_set():
                return
            if error:
                if error != "Cancelled.":
                    self.error_occurred.emit(error)
                return
            if not scenes:
                self.error_occurred.emit("No scenes detected.")
                return

            clustered = self.ml_engine.cluster_scenes(
                scenes,
                eps=self.eps,
                min_samples=self.min_samples,
                progress_callback=p_callback,
                cancel_event=self._cancel,
            )
            if not self._cancel.is_set():
                self.finished_analysis.emit(clustered)
        except Exception as e:
            if not self._cancel.is_set():
                logger.exception("Analysis failed")
                self.error_occurred.emit(str(e))


class ReclusterWorker(QThread):
    progress_updated = pyqtSignal(int, str)
    finished_analysis = pyqtSignal(list)
    error_occurred = pyqtSignal(str)

    def __init__(self, scenes_data, ml_engine: MLEngine, eps, min_samples):
        super().__init__()
        self.scenes_data = scenes_data
        self.ml_engine = ml_engine
        self.eps = eps
        self.min_samples = min_samples

    def run(self):
        try:
            def p_callback(val, msg):
                self.progress_updated.emit(val, msg)

            # Copy so we don't mutate mid-paint unexpectedly
            scenes = [dict(s) for s in self.scenes_data]
            clustered = self.ml_engine.recluster_cached(
                scenes, eps=self.eps, min_samples=self.min_samples, progress_callback=p_callback
            )
            self.finished_analysis.emit(clustered)
        except Exception as e:
            logger.exception("Recluster failed")
            self.error_occurred.emit(str(e))


class ExportWorker(QThread):
    progress_updated = pyqtSignal(int, str)
    finished_export = pyqtSignal()
    error_occurred = pyqtSignal(str)

    def __init__(self, video_path, ordered_scenes, output_path, accurate=False):
        super().__init__()
        self.video_path = video_path
        self.ordered_scenes = ordered_scenes
        self.output_path = output_path
        self.accurate = accurate
        self._cancel = threading.Event()

    def cancel(self):
        self._cancel.set()

    def run(self):
        try:
            def p_callback(val, msg):
                self.progress_updated.emit(val, msg)

            export_video(
                self.video_path,
                self.ordered_scenes,
                self.output_path,
                progress_callback=p_callback,
                cancel_event=self._cancel,
                accurate=self.accurate,
            )
            if not self._cancel.is_set():
                self.finished_export.emit()
        except Exception as e:
            if not self._cancel.is_set() or "cancelled" not in str(e).lower():
                self.error_occurred.emit(str(e))
            elif self._cancel.is_set():
                self.error_occurred.emit("Export cancelled.")


class SceneThumbnail(QFrame):
    def __init__(self, scene_data, video_path, parent=None, on_add=None, on_add_cluster=None):
        super().__init__(parent)
        self.scene_data = scene_data
        self.video_path = video_path
        self.on_add = on_add
        self.on_add_cluster = on_add_cluster
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setFixedWidth(180)

        cluster = int(scene_data.get("cluster", -1))
        color = "#64748b" if cluster < 0 else CLUSTER_COLORS[cluster % len(CLUSTER_COLORS)]

        self.original_pixmap = QPixmap(scene_data["frame_path"]).scaled(
            168, 94, Qt.AspectRatioMode.KeepAspectRatio,
            Qt.TransformationMode.SmoothTransformation,
        )
        self.preview_worker = None

        layout = QVBoxLayout(self)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(6)

        self.image_label = QLabel()
        self.image_label.setPixmap(self.original_pixmap)
        self.image_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.image_label)

        meta = QHBoxLayout()
        badge = QLabel("noise" if cluster < 0 else f"C{cluster}")
        badge.setStyleSheet(
            f"color: {color}; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;"
        )
        dur = QLabel(f"{scene_data['duration']:.1f}s")
        dur.setStyleSheet("color: #94a3b8; font-size: 11px;")
        meta.addWidget(badge)
        meta.addStretch()
        meta.addWidget(dur)
        layout.addLayout(meta)

        # Left-edge cluster accent via stylesheet border is enough; paint a bar
        self._accent = color

    def paintEvent(self, event):
        super().paintEvent(event)
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        p.setPen(Qt.PenStyle.NoPen)
        p.setBrush(QColor(self._accent))
        p.drawRoundedRect(0, 10, 3, self.height() - 20, 1.5, 1.5)
        p.end()

    def enterEvent(self, event):
        super().enterEvent(event)
        if self.preview_worker and self.preview_worker.isRunning():
            return
        self.preview_worker = PreviewWorker(
            self.video_path, self.scene_data["start_time"], self.scene_data["duration"]
        )
        self.preview_worker.frame_ready.connect(self.update_image)
        self.preview_worker.start()

    def leaveEvent(self, event):
        super().leaveEvent(event)
        if self.preview_worker:
            self.preview_worker.running = False
            self.preview_worker.wait(500)
            try:
                self.preview_worker.frame_ready.disconnect()
            except TypeError:
                pass
            self.preview_worker = None
        self.image_label.setPixmap(self.original_pixmap)

    def update_image(self, pixmap):
        self.image_label.setPixmap(pixmap)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton and self.on_add:
            self.on_add(self.scene_data)
        elif event.button() == Qt.MouseButton.RightButton and self.on_add_cluster:
            self.on_add_cluster(self.scene_data.get("cluster", -1))


class TimelineDelegate(QStyledItemDelegate):
    """Paints a red 'DEL' hit-target on each timeline row (no image asset)."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self._font = QFont("Cascadia Mono", 9)
        self._font.setBold(True)
        if not self._font.exactMatch():
            self._font = QFont("Consolas", 9)
            self._font.setBold(True)

    def _delete_rect(self, option_rect: QRect) -> QRect:
        # Wider hit target for the text label
        w, h = 40, 18
        return QRect(
            option_rect.right() - w - 10,
            option_rect.top() + (option_rect.height() - h) // 2,
            w,
            h,
        )

    def paint(self, painter, option, index):
        super().paint(painter, option, index)
        delete_rect = self._delete_rect(option.rect)
        painter.save()
        painter.setRenderHint(QPainter.RenderHint.TextAntialiasing)
        painter.setFont(self._font)
        # subtle red pill background
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QColor(255, 77, 109, 28))
        painter.drawRect(delete_rect)
        painter.setPen(QColor("#ff4d6d"))
        painter.drawText(delete_rect, int(Qt.AlignmentFlag.AlignCenter), "DEL")
        painter.restore()

    def editorEvent(self, event, model, option, index):
        if event.type() == QEvent.Type.MouseButtonRelease:
            if self._delete_rect(option.rect).contains(event.pos()):
                model.removeRow(index.row())
                # notify parent list if it has changed signal
                parent = self.parent()
                if parent is not None and hasattr(parent, "changed"):
                    try:
                        parent.changed.emit()
                    except Exception:
                        pass
                return True
        return super().editorEvent(event, model, option, index)


class TimelineListWidget(QListWidget):
    changed = pyqtSignal()

    def keyPressEvent(self, event):
        if event.key() in (Qt.Key.Key_Delete, Qt.Key.Key_Backspace):
            for item in self.selectedItems():
                self.takeItem(self.row(item))
            self.changed.emit()
        else:
            super().keyPressEvent(event)

    def dropEvent(self, event):
        super().dropEvent(event)
        self.changed.emit()




class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Fracture")
        icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons", "view.png")
        if os.path.isfile(icon_path):
            self.setWindowIcon(QIcon(icon_path))
        self.resize(1380, 880)
        self.setAcceptDrops(True)

        self.video_path = None
        self.scenes_data = []
        self.is_dark_mode = True
        self.eps = 0.35
        self.min_samples = 2
        self.accurate_export = False
        self.cluster_filter = None
        self.worker = None
        self.export_worker = None
        self.recluster_worker = None
        self.ml_engine = MLEngine()
        self._undo_stack = []
        self._bridge = _UiBridge()
        self._bridge.status.connect(self._set_status)
        self._pulse_phase = 0

        self.init_ui()
        self.apply_styles()
        self._bind_shortcuts()
        self._start_pulse()

        self.status_label.setText(" Loading AI model…")
        preload_model_async(self._on_model_preload)

    def _start_pulse(self):
        self._pulse_timer = QTimer(self)
        self._pulse_timer.timeout.connect(self._tick_pulse)
        self._pulse_timer.start(60)

    def _tick_pulse(self):
        if not hasattr(self, "pulse_dot"):
            return
        busy = (self.worker and self.worker.isRunning()) or (
            self.export_worker and self.export_worker.isRunning()
        )
        self._pulse_phase = (self._pulse_phase + (8 if busy else 3)) % 360
        t = (math.sin(math.radians(self._pulse_phase)) + 1) / 2
        s = 8 + int(t * 4) if busy else 10
        self.pulse_dot.setFixedSize(s, s)
        color = "#4ade80" if busy else "#22c55e"
        self.pulse_dot.setStyleSheet(
            f"#PulseDot {{ background-color: {color}; border-radius: {max(1, s // 2)}px; }}"
        )

    def init_ui(self):
        central = QWidget()
        central.setObjectName("ContentRoot")
        self.setCentralWidget(central)
        outer = QHBoxLayout(central)
        outer.setContentsMargins(0, 0, 0, 0)
        outer.setSpacing(0)

        # Left icon sidebar (SpotiFLAC-style)
        sidebar = QFrame()
        sidebar.setObjectName("Sidebar")
        sidebar.setFixedWidth(64)
        sb = QVBoxLayout(sidebar)
        sb.setContentsMargins(12, 56, 12, 16)
        sb.setSpacing(8)

        self.nav_home = QToolButton()
        self.nav_home.setObjectName("NavBtn")
        self.nav_home.setText("⌂")
        self.nav_home.setToolTip("Studio")
        self.nav_home.setProperty("active", True)
        self.nav_home.setCursor(Qt.CursorShape.PointingHandCursor)

        self.nav_settings = QToolButton()
        self.nav_settings.setObjectName("NavBtn")
        self.nav_settings.setText("⚙")
        self.nav_settings.setToolTip("Settings  (S)")
        self.nav_settings.setCursor(Qt.CursorShape.PointingHandCursor)
        self.nav_settings.clicked.connect(self.open_settings)

        sb.addWidget(self.nav_home, 0, Qt.AlignmentFlag.AlignHCenter)
        sb.addWidget(self.nav_settings, 0, Qt.AlignmentFlag.AlignHCenter)
        sb.addStretch(1)

        brand_mark = QLabel("F")
        brand_mark.setAlignment(Qt.AlignmentFlag.AlignCenter)
        brand_mark.setStyleSheet(
            "color: #22c55e; font-weight: 800; font-size: 16px; "
            "background: rgba(34,197,94,0.12); border-radius: 10px; "
            "min-width: 36px; max-width: 36px; min-height: 36px; max-height: 36px;"
        )
        sb.addWidget(brand_mark, 0, Qt.AlignmentFlag.AlignHCenter)
        outer.addWidget(sidebar)

        main_col = QVBoxLayout()
        main_col.setContentsMargins(24, 20, 24, 12)
        main_col.setSpacing(14)

        # Hero
        hero = QHBoxLayout()
        hero.setSpacing(12)
        self.pulse_dot = QFrame()
        self.pulse_dot.setObjectName("PulseDot")
        self.pulse_dot.setFixedSize(10, 10)

        title_col = QVBoxLayout()
        title_col.setSpacing(2)
        title_row = QHBoxLayout()
        title_row.setSpacing(10)
        hero_title = QLabel("Fracture")
        hero_title.setObjectName("HeroTitle")
        self.version_badge = QLabel("v2")
        self.version_badge.setObjectName("VersionBadge")
        title_row.addWidget(hero_title)
        title_row.addWidget(self.version_badge)
        title_row.addStretch()
        hero_sub = QLabel(
            "Local AI scene split · cluster · lossless export — no account required."
        )
        hero_sub.setObjectName("HeroSub")
        title_col.addLayout(title_row)
        title_col.addWidget(hero_sub)
        hero.addWidget(self.pulse_dot, 0, Qt.AlignmentFlag.AlignTop)
        hero.addLayout(title_col, 1)
        main_col.addLayout(hero)

        # Toolbar card
        toolbar = QFrame()
        toolbar.setObjectName("Toolbar")
        toolbar.setGraphicsEffect(_shadow(28, 8, 70))
        tb = QHBoxLayout(toolbar)
        tb.setContentsMargins(14, 12, 14, 12)
        tb.setSpacing(10)

        self.import_btn = QPushButton("  Import video")
        self.import_btn.setObjectName("PrimaryButton")
        self.import_btn.setToolTip("Import video  (I)")
        self.import_btn.clicked.connect(self.import_video)

        self.add_cluster_btn = QPushButton("Add cluster")
        self.add_cluster_btn.setObjectName("GhostButton")
        self.add_cluster_btn.setToolTip("Add all scenes from the active filter cluster")
        self.add_cluster_btn.clicked.connect(self.add_filtered_cluster)
        self.add_cluster_btn.setEnabled(False)

        self.clear_tl_btn = QPushButton("Clear")
        self.clear_tl_btn.setObjectName("DangerButton")
        self.clear_tl_btn.clicked.connect(self.clear_timeline)
        self.clear_tl_btn.setEnabled(False)

        self.cancel_btn = QPushButton("Cancel")
        self.cancel_btn.setObjectName("SecondaryButton")
        self.cancel_btn.clicked.connect(self.cancel_active_job)
        self.cancel_btn.setEnabled(False)

        self.settings_btn = QPushButton("Settings")
        self.settings_btn.setObjectName("SettingsButton")
        self.settings_btn.setToolTip("Settings  (S)")
        self.settings_btn.clicked.connect(self.open_settings)

        self.export_btn = QPushButton("  Export")
        self.export_btn.setObjectName("PrimaryButton")
        self.export_btn.setToolTip("Export timeline  (E)")
        self.export_btn.clicked.connect(self.export_timeline)
        self.export_btn.setEnabled(False)

        self.duration_pill = QLabel("0.00s")
        self.duration_pill.setObjectName("DurationPill")
        self.duration_pill.setAlignment(Qt.AlignmentFlag.AlignCenter)

        tb.addWidget(self.import_btn)
        tb.addWidget(self.add_cluster_btn)
        tb.addWidget(self.clear_tl_btn)
        tb.addStretch()
        tb.addWidget(self.duration_pill)
        tb.addWidget(self.cancel_btn)
        tb.addWidget(self.settings_btn)
        tb.addWidget(self.export_btn)
        main_col.addWidget(toolbar)
        fade_in(toolbar, 320)

        # Chips
        self.chip_bar = QHBoxLayout()
        self.chip_bar.setSpacing(8)
        self.chip_host = QWidget()
        self.chip_host.setLayout(self.chip_bar)
        self.chip_scroll = QScrollArea()
        self.chip_scroll.setWidgetResizable(True)
        self.chip_scroll.setFixedHeight(48)
        self.chip_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        self.chip_scroll.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.chip_scroll.setWidget(self.chip_host)
        main_col.addWidget(self.chip_scroll)

        # Splitter
        self.splitter = QSplitter(Qt.Orientation.Vertical)
        self.splitter.setChildrenCollapsible(False)

        pool = QFrame()
        pool.setObjectName("PanelFrame")
        pool.setGraphicsEffect(_shadow(22, 6, 60))
        pool_l = QVBoxLayout(pool)
        pool_l.setContentsMargins(16, 14, 16, 14)
        pool_l.setSpacing(10)

        pool_header = QHBoxLayout()
        pool_title = QLabel("Media Pool")
        pool_title.setObjectName("PanelTitle")
        self.pool_meta = QLabel("Drop a video or click Import")
        self.pool_meta.setObjectName("PanelMeta")
        pool_header.addWidget(pool_title)
        pool_header.addStretch()
        pool_header.addWidget(self.pool_meta)
        pool_l.addLayout(pool_header)

        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.verticalScrollBar().setSingleStep(24)
        self.scroll_content = QWidget()
        self.scroll_content.setStyleSheet("background: transparent;")
        self.grid_layout = QGridLayout(self.scroll_content)
        self.grid_layout.setSpacing(14)
        self.grid_layout.setAlignment(Qt.AlignmentFlag.AlignTop | Qt.AlignmentFlag.AlignLeft)
        self.scroll_area.setWidget(self.scroll_content)

        self.drop_hint = QLabel("Drop .mp4 / .mkv / .mov here\nor press  I  to import")
        self.drop_hint.setObjectName("DropHint")
        self.drop_hint.setAlignment(Qt.AlignmentFlag.AlignCenter)
        pool_l.addWidget(self.drop_hint)
        pool_l.addWidget(self.scroll_area)
        self.scroll_area.hide()
        self.splitter.addWidget(pool)

        tl = QFrame()
        tl.setObjectName("PanelFrame")
        tl.setGraphicsEffect(_shadow(22, 6, 60))
        tl_l = QVBoxLayout(tl)
        tl_l.setContentsMargins(16, 14, 16, 14)
        tl_l.setSpacing(10)

        tl_header = QHBoxLayout()
        tl_title = QLabel("Timeline")
        tl_title.setObjectName("PanelTitle")
        self.tl_meta = QLabel("Click scenes · drag to reorder · DEL to remove · Ctrl+Z undo")
        self.tl_meta.setObjectName("PanelMeta")
        tl_header.addWidget(tl_title)
        tl_header.addStretch()
        tl_header.addWidget(self.tl_meta)
        tl_l.addLayout(tl_header)

        self.timeline_list = TimelineListWidget()
        self.timeline_list.setDragDropMode(QAbstractItemView.DragDropMode.InternalMove)
        self.timeline_list.setIconSize(QSize(96, 54))
        self.timeline_list.setVerticalScrollMode(QAbstractItemView.ScrollMode.ScrollPerPixel)
        self.timeline_list.verticalScrollBar().setSingleStep(16)
        self.timeline_list.setItemDelegate(TimelineDelegate(self.timeline_list))
        self.timeline_list.changed.connect(self._on_timeline_changed)
        self.timeline_list.model().rowsRemoved.connect(lambda *_: self._on_timeline_changed())
        tl_l.addWidget(self.timeline_list)
        self.splitter.addWidget(tl)
        self.splitter.setSizes([540, 260])
        main_col.addWidget(self.splitter, 1)

        outer.addLayout(main_col, 1)

        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_label = QLabel(" Ready")
        self.progress_bar = QProgressBar()
        self.progress_bar.setFixedWidth(240)
        self.progress_bar.setTextVisible(False)
        self.progress_bar.hide()
        self.status_bar.addWidget(self.status_label, 1)
        self.status_bar.addPermanentWidget(self.progress_bar)

        fade_in(pool, 380, delay=40)
        fade_in(tl, 420, delay=90)


    def apply_styles(self):
        self.setStyleSheet(get_stylesheet(self.is_dark_mode))

    def _bind_shortcuts(self):
        QShortcut(QKeySequence("I"), self, activated=self.import_video)
        QShortcut(QKeySequence("E"), self, activated=self.export_timeline)
        QShortcut(QKeySequence("S"), self, activated=self.open_settings)
        QShortcut(QKeySequence("Ctrl+Z"), self, activated=self.undo_timeline)
        QShortcut(QKeySequence("Escape"), self, activated=self.cancel_active_job)
        for n in range(10):
            QShortcut(QKeySequence(str(n)), self, activated=lambda n=n: self._filter_by_number(n))

    # ── Drag & drop ─────────────────────────────────────
    def dragEnterEvent(self, event):
        if event.mimeData().hasUrls():
            event.acceptProposedAction()

    def dropEvent(self, event):
        for url in event.mimeData().urls():
            path = url.toLocalFile()
            if path.lower().endswith((".mp4", ".mkv", ".avi", ".mov", ".webm", ".m4v")):
                self.video_path = path
                self.start_analysis()
                break

    # ── Model preload ───────────────────────────────────
    def _set_status(self, text: str):
        self.status_label.setText(text)

    def _on_model_preload(self, ok, err):
        # Called from background thread — hop to UI via signal
        if ok:
            self._bridge.status.emit(" Ready  ·  AI model loaded")
        else:
            self._bridge.status.emit(f" Model preload failed: {err}")

    # ── Settings ────────────────────────────────────────
    def open_settings(self):
        dialog = SettingsDialog(
            self, self.is_dark_mode, self.eps, self.min_samples, self.accurate_export
        )
        if not dialog.exec():
            return

        prev_eps, prev_min = self.eps, self.min_samples
        self.is_dark_mode = dialog.is_dark
        self.eps = dialog.eps_spin.value()
        self.min_samples = dialog.min_samples_spin.value()
        self.accurate_export = dialog.accurate_check.isChecked()
        self.apply_styles()
        get_stylesheet.cache_clear()
        self.apply_styles()

        # Recluster if params changed and we have cache
        if self.scenes_data and (self.eps != prev_eps or self.min_samples != prev_min):
            if self.ml_engine._cached_embeddings is not None:
                self._start_recluster()
            else:
                self.status_label.setText(" Settings saved — re-import to recluster")

    def _start_recluster(self):
        self._set_busy(True, " Reclustering…")
        self.recluster_worker = ReclusterWorker(
            self.scenes_data, self.ml_engine, self.eps, self.min_samples
        )
        self.recluster_worker.progress_updated.connect(self.update_progress)
        self.recluster_worker.finished_analysis.connect(self.on_analysis_finished)
        self.recluster_worker.error_occurred.connect(self.on_analysis_error)
        self.recluster_worker.start()

    # ── Lifecycle ───────────────────────────────────────
    def closeEvent(self, event):
        self.cancel_active_job()
        if self.worker and self.worker.isRunning():
            self.worker.wait(4000)
        if self.export_worker and self.export_worker.isRunning():
            self.export_worker.wait(4000)
        event.accept()

    def cancel_active_job(self):
        if self.worker and self.worker.isRunning():
            self.worker.cancel()
            self.status_label.setText(" Cancelling analysis…")
        if self.export_worker and self.export_worker.isRunning():
            self.export_worker.cancel()
            self.status_label.setText(" Cancelling export…")

    def _set_busy(self, busy, msg=""):
        self.import_btn.setEnabled(not busy)
        self.settings_btn.setEnabled(not busy)
        self.export_btn.setEnabled(not busy and self.timeline_list.count() > 0)
        self.add_cluster_btn.setEnabled(not busy and bool(self.scenes_data))
        self.cancel_btn.setEnabled(busy)
        if busy:
            self.progress_bar.setValue(0)
            self.progress_bar.show()
            if msg:
                self.status_label.setText(msg)
        else:
            self.progress_bar.hide()

    # ── Import / analysis ───────────────────────────────
    def import_video(self):
        path, _ = QFileDialog.getOpenFileName(
            self, "Import Media", "",
            "Video Files (*.mp4 *.mkv *.avi *.mov *.webm *.m4v)",
        )
        if path:
            self.video_path = path
            self.start_analysis()

    def start_analysis(self):
        if not self.video_path:
            return
        self._set_busy(True, " Analyzing scenes…")
        self._clear_pool()
        self.timeline_list.clear()
        self._undo_stack.clear()
        self._update_duration()
        self.cluster_filter = None
        self._rebuild_chips([])

        temp_dir = os.path.join(tempfile.gettempdir(), "video_classifier_frames")
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

        self.ml_engine.clear_cache()
        self.worker = AnalysisWorker(
            self.video_path, self.ml_engine, eps=self.eps, min_samples=self.min_samples
        )
        self.worker.progress_updated.connect(self.update_progress)
        self.worker.finished_analysis.connect(self.on_analysis_finished)
        self.worker.error_occurred.connect(self.on_analysis_error)
        self.worker.start()

    def update_progress(self, val, msg):
        self.progress_bar.setValue(val)
        self.status_label.setText(f" {msg}")

    def on_analysis_finished(self, clustered_scenes):
        self.scenes_data = clustered_scenes
        self.scenes_data.sort(key=lambda x: (x.get("cluster", -1), x.get("start_time", 0)))
        self._rebuild_chips(self.scenes_data)
        self._populate_pool()
        self._set_busy(False)
        n_c = len({s.get("cluster", -1) for s in self.scenes_data if s.get("cluster", -1) >= 0})
        n_noise = sum(1 for s in self.scenes_data if s.get("cluster", -1) < 0)
        self.pool_meta.setText(f"{len(self.scenes_data)} scenes  ·  {n_c} clusters  ·  {n_noise} noise")
        self.status_label.setText(" Analysis complete")
        self.add_cluster_btn.setEnabled(True)
        name = os.path.basename(self.video_path or "")
        self.setWindowTitle(f"Fracture  ·  {name}")

    def on_analysis_error(self, error_msg):
        self._set_busy(False)
        self.status_label.setText(" Error")
        PremiumNotification(
            "System Error", str(error_msg), is_error=True,
            parent=self, is_dark_mode=self.is_dark_mode,
        ).exec()

    def _clear_pool(self):
        while self.grid_layout.count():
            item = self.grid_layout.takeAt(0)
            w = item.widget()
            if w:
                w.setParent(None)
                w.deleteLater()

    def _populate_pool(self):
        self._clear_pool()
        scenes = self.scenes_data
        if self.cluster_filter is not None:
            scenes = [s for s in scenes if s.get("cluster", -1) == self.cluster_filter]

        if not scenes:
            if hasattr(self, "drop_hint"):
                self.drop_hint.show()
            if hasattr(self, "scroll_area"):
                self.scroll_area.hide()
            self.pool_meta.setText("Drop a video or click Import")
            return

        if hasattr(self, "drop_hint"):
            self.drop_hint.hide()
        if hasattr(self, "scroll_area"):
            self.scroll_area.show()

        cols = max(4, max(1, self.scroll_area.viewport().width()) // 200)
        for i, scene in enumerate(scenes):
            thumb = SceneThumbnail(
                scene, self.video_path, self,
                on_add=self.add_to_timeline,
                on_add_cluster=self.add_cluster_to_timeline,
            )
            self.grid_layout.addWidget(thumb, i // cols, i % cols)
            fade_in(thumb, duration=260, delay=min(i * 18, 420))
        self.pool_meta.setText(
            f"showing {len(scenes)} / {len(self.scenes_data)} scenes"
            if self.cluster_filter is not None
            else f"{len(self.scenes_data)} scenes"
        )

    def _rebuild_chips(self, scenes):
        # Clear chip bar
        while self.chip_bar.count():
            item = self.chip_bar.takeAt(0)
            w = item.widget()
            if w:
                w.setParent(None)
                w.deleteLater()

        all_btn = QPushButton("All")
        all_btn.setObjectName("ClusterChip")
        all_btn.setProperty("selected", self.cluster_filter is None)
        all_btn.clicked.connect(lambda: self._set_cluster_filter(None))
        self.chip_bar.addWidget(all_btn)

        clusters = sorted({s.get("cluster", -1) for s in scenes})
        for c in clusters:
            label = "noise" if c < 0 else f"C{c}"
            count = sum(1 for s in scenes if s.get("cluster", -1) == c)
            btn = QPushButton(f"{label} · {count}")
            btn.setObjectName("ClusterChip")
            btn.setProperty("selected", self.cluster_filter == c)
            color = "#64748b" if c < 0 else CLUSTER_COLORS[c % len(CLUSTER_COLORS)]
            if self.cluster_filter == c:
                btn.setStyleSheet(
                    f"QPushButton#ClusterChip {{ border-color: {color}; color: {color}; }}"
                )
            btn.clicked.connect(lambda _=False, cc=c: self._set_cluster_filter(cc))
            # Double-click add: use custom context — also right-click on thumb
            btn.setToolTip("Click to filter · Shift+click to add whole cluster")
            self.chip_bar.addWidget(btn)

        self.chip_bar.addStretch()
        # Force style refresh
        self.chip_host.style().unpolish(self.chip_host)
        self.chip_host.style().polish(self.chip_host)

    def _set_cluster_filter(self, cluster_id):
        modifiers = self.app_keyboard_modifiers() if hasattr(self, "app_keyboard_modifiers") else None
        from PyQt6.QtWidgets import QApplication
        mods = QApplication.keyboardModifiers()
        if mods & Qt.KeyboardModifier.ShiftModifier and cluster_id is not None:
            self.add_cluster_to_timeline(cluster_id)
            return
        self.cluster_filter = cluster_id
        self._rebuild_chips(self.scenes_data)
        self._populate_pool()

    def _filter_by_number(self, n):
        if not self.scenes_data:
            return
        if n == 0:
            self._set_cluster_filter(None)
        else:
            # 1-based cluster index among non-noise
            clusters = sorted({s.get("cluster", -1) for s in self.scenes_data if s.get("cluster", -1) >= 0})
            if 1 <= n <= len(clusters):
                self._set_cluster_filter(clusters[n - 1])

    # ── Timeline ────────────────────────────────────────
    def _snapshot_timeline(self):
        scenes = []
        for i in range(self.timeline_list.count()):
            item = self.timeline_list.item(i)
            scenes.append(item.data(Qt.ItemDataRole.UserRole))
        self._undo_stack.append(scenes)
        if len(self._undo_stack) > 40:
            self._undo_stack.pop(0)

    def undo_timeline(self):
        if not self._undo_stack:
            return
        scenes = self._undo_stack.pop()
        self.timeline_list.clear()
        for s in scenes:
            self._append_timeline_item(s, push_undo=False)
        self._on_timeline_changed()

    def add_to_timeline(self, scene_data):
        # De-dupe by id + start_time
        for i in range(self.timeline_list.count()):
            existing = self.timeline_list.item(i).data(Qt.ItemDataRole.UserRole)
            if existing and existing.get("id") == scene_data.get("id") and \
               abs(existing.get("start_time", 0) - scene_data.get("start_time", 0)) < 1e-3:
                self.status_label.setText(" Scene already on timeline")
                return
        self._snapshot_timeline()
        self._append_timeline_item(scene_data)
        self._on_timeline_changed()

    def _append_timeline_item(self, scene_data, push_undo=True):
        cluster = scene_data.get("cluster", -1)
        item = QListWidgetItem()
        item.setText(
            f"  {'noise' if cluster < 0 else f'C{cluster}'}   "
            f"{scene_data['duration']:.2f}s   "
            f"[{scene_data['start_time']:.2f}s → {scene_data['end_time']:.2f}s]"
        )
        if os.path.isfile(scene_data.get("frame_path", "")):
            item.setIcon(QIcon(scene_data["frame_path"]))
        item.setData(Qt.ItemDataRole.UserRole, scene_data)
        self.timeline_list.addItem(item)

    def add_cluster_to_timeline(self, cluster_id):
        if cluster_id is None:
            return
        members = [s for s in self.scenes_data if s.get("cluster", -1) == cluster_id]
        if not members:
            return
        self._snapshot_timeline()
        existing_ids = set()
        for i in range(self.timeline_list.count()):
            e = self.timeline_list.item(i).data(Qt.ItemDataRole.UserRole)
            if e:
                existing_ids.add(e.get("id"))
        added = 0
        for s in sorted(members, key=lambda x: x.get("start_time", 0)):
            if s.get("id") in existing_ids:
                continue
            self._append_timeline_item(s, push_undo=False)
            added += 1
        self._on_timeline_changed()
        self.status_label.setText(f" Added {added} scenes from cluster {cluster_id}")

    def add_filtered_cluster(self):
        if self.cluster_filter is None:
            # Add all visible? prefer prompt via status
            self.status_label.setText(" Filter a cluster first (or Shift+click a chip)")
            return
        self.add_cluster_to_timeline(self.cluster_filter)

    def clear_timeline(self):
        if self.timeline_list.count() == 0:
            return
        self._snapshot_timeline()
        self.timeline_list.clear()
        self._on_timeline_changed()

    def _on_timeline_changed(self):
        count = self.timeline_list.count()
        self.export_btn.setEnabled(count > 0)
        self.clear_tl_btn.setEnabled(count > 0)
        self._update_duration()

    def _update_duration(self):
        total = 0.0
        for i in range(self.timeline_list.count()):
            s = self.timeline_list.item(i).data(Qt.ItemDataRole.UserRole)
            if s:
                total += float(s.get("duration", 0))
        mins = int(total // 60)
        secs = total % 60
        self.duration_pill.setText(f"{mins}:{secs:05.2f}" if mins else f"{secs:.2f}s")
        self.tl_meta.setText(
            f"{self.timeline_list.count()} clips  ·  drag to reorder  ·  Ctrl+Z undo"
        )

    def _ordered_scenes(self):
        out = []
        for i in range(self.timeline_list.count()):
            s = self.timeline_list.item(i).data(Qt.ItemDataRole.UserRole)
            if s:
                out.append(s)
        return out

    # ── Export ──────────────────────────────────────────
    def export_timeline(self):
        if self.timeline_list.count() == 0 or not self.video_path:
            return
        output_path, _ = QFileDialog.getSaveFileName(
            self, "Export Render", "", "MP4 Video (*.mp4)"
        )
        if not output_path:
            return
        if not output_path.lower().endswith(".mp4"):
            output_path += ".mp4"

        ordered = self._ordered_scenes()
        self._set_busy(True, " Rendering export…")
        self.export_worker = ExportWorker(
            self.video_path, ordered, output_path, accurate=self.accurate_export
        )
        self.export_worker.progress_updated.connect(self.update_progress)
        self.export_worker.finished_export.connect(self.on_export_finished)
        self.export_worker.error_occurred.connect(self.on_export_error)
        self.export_worker.start()

    def on_export_finished(self):
        self._set_busy(False)
        self.status_label.setText(" Export complete")
        PremiumNotification(
            "Render Complete", "Export completed successfully.",
            is_error=False, parent=self, is_dark_mode=self.is_dark_mode,
        ).exec()

    def on_export_error(self, error_msg):
        self._set_busy(False)
        self.status_label.setText(" Export failed")
        PremiumNotification(
            "Render Error", str(error_msg), is_error=True,
            parent=self, is_dark_mode=self.is_dark_mode,
        ).exec()

    # ── Project save / load (lightweight) ───────────────
    def save_project(self):
        if not self.video_path:
            return
        path, _ = QFileDialog.getSaveFileName(self, "Save Project", "", "Fracture Project (*.fracture.json)")
        if not path:
            return
        data = {
            "video_path": self.video_path,
            "eps": self.eps,
            "min_samples": self.min_samples,
            "accurate_export": self.accurate_export,
            "timeline": self._ordered_scenes(),
            "scenes": self.scenes_data,
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        self.status_label.setText(f" Project saved · {os.path.basename(path)}")
