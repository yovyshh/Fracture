import os
import math
import time
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QFileDialog, QProgressBar, QListWidget, QListWidgetItem,
    QScrollArea, QGridLayout, QMessageBox, QFrame, QAbstractItemView,
    QSplitter, QGraphicsDropShadowEffect, QStyleOption, QStyle, QDialog,
    QStyledItemDelegate
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal, QSize, QTimer, QRect, QEvent
from PyQt6.QtGui import QPixmap, QIcon, QColor, QBrush, QPainter, QFont

from video_processor import detect_scenes_and_extract_frames
from ml_engine import MLEngine
from exporter import export_video
import tempfile

class PremiumNotification(QDialog):
    def __init__(self, title, message, is_error=False, parent=None):
        super().__init__(parent)
        self.setWindowTitle(title)
        self.setFixedSize(400, 220)
        
        self.setWindowFlags(Qt.WindowType.Dialog | Qt.WindowType.FramelessWindowHint)
        glow_color = "#FF5252" if is_error else "#8B5CF6"
        
        self.setStyleSheet(f"""
            QDialog {{
                background-color: #121214;
                border: 1px solid {glow_color};
                border-radius: 12px;
            }}
            QLabel {{
                color: #F9FAFB;
                font-family: "Inter", "Segoe UI", sans-serif;
            }}
            QPushButton {{
                background-color: #1A1A1E;
                color: #F9FAFB;
                border: 1px solid #333;
                padding: 10px 30px;
                border-radius: 20px;
                font-weight: 700;
                font-size: 11px;
                letter-spacing: 1px;
            }}
            QPushButton:hover {{
                border: 1px solid {glow_color};
                background-color: #1E1E24;
            }}
        """)
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(40, 40, 40, 40)
        layout.setSpacing(20)
        
        title_label = QLabel(title.upper())
        title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title_label.setStyleSheet(f"color: {glow_color}; font-size: 14px; font-weight: 900; letter-spacing: 2px;")
        layout.addWidget(title_label)
        
        msg_label = QLabel(message)
        msg_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        msg_label.setStyleSheet("font-size: 12px; color: #D1D5DB;")
        msg_label.setWordWrap(True)
        layout.addWidget(msg_label)
        
        btn_layout = QHBoxLayout()
        ok_btn = QPushButton("OK")
        ok_btn.clicked.connect(self.accept)
        
        effect = QGraphicsDropShadowEffect()
        effect.setBlurRadius(15)
        effect.setColor(QColor(255, 82, 82, 60) if is_error else QColor(139, 92, 246, 60))
        effect.setOffset(0, 0)
        ok_btn.setGraphicsEffect(effect)
        
        btn_layout.addStretch()
        btn_layout.addWidget(ok_btn)
        btn_layout.addStretch()
        
        layout.addLayout(btn_layout)

class BinaryBackgroundCanvas(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.update)
        # 60 FPS update loop
        self.timer.start(1000 // 60)
        
    def paintEvent(self, event):
        opt = QStyleOption()
        opt.initFrom(self)
        painter = QPainter(self)
        self.style().drawPrimitive(QStyle.PrimitiveElement.PE_Widget, opt, painter, self)
        
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        painter.setFont(QFont("Consolas", 12, QFont.Weight.Bold))
        
        w = self.width()
        h = self.height()
        t = time.time()
        
        for i in range(25):
            alpha = int((math.sin(t * 1.5 + i) + 1) * 20) + 5
            # Electric Violet for dark mode
            painter.setPen(QColor(139, 92, 246, alpha))
            
            y1 = int((i * h / 25) + (math.cos(t + i) * 15))
            x1 = int(10 + (i % 4) * 20)
            char1 = '1' if int(t * 8 + i) % 2 == 0 else '0'
            painter.drawText(x1, y1, char1)
            
            y2 = int((i * h / 25) + (math.sin(t + i) * 15))
            x2 = int(w - 30 - (i % 4) * 20)
            char2 = '0' if int(t * 8 + i) % 3 == 0 else '1'
            painter.drawText(x2, y2, char2)

class AnalysisWorker(QThread):
    progress_updated = pyqtSignal(int, str)
    finished_analysis = pyqtSignal(list)
    error_occurred = pyqtSignal(str)

    def __init__(self, video_path):
        super().__init__()
        self.video_path = video_path
        self.ml_engine = MLEngine()

    def run(self):
        try:
            temp_dir = os.path.join(tempfile.gettempdir(), "video_classifier_frames")
            def p_callback(val, msg):
                self.progress_updated.emit(val, msg)

            scenes = detect_scenes_and_extract_frames(self.video_path, temp_dir, p_callback)
            if not scenes:
                self.error_occurred.emit("No scenes detected or video format unsupported.")
                return

            clustered_scenes = self.ml_engine.cluster_scenes(scenes, n_clusters=5, progress_callback=p_callback)
            self.finished_analysis.emit(clustered_scenes)
        except Exception as e:
            self.error_occurred.emit(str(e))

class SceneThumbnail(QWidget):
    def __init__(self, scene_data, parent=None):
        super().__init__(parent)
        self.scene_data = scene_data
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(8)
        
        self.image_label = QLabel()
        pixmap = QPixmap(scene_data['frame_path'])
        self.image_label.setPixmap(pixmap.scaled(160, 90, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation))
        self.image_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.image_label.setStyleSheet("border-radius: 4px;")
        
        self.info_label = QLabel(f"CLUSTER {scene_data['cluster']}  •  {scene_data['duration']:.1f}S")
        self.info_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.info_label.setStyleSheet("color: #6B7280; font-size: 9px; font-weight: 700; letter-spacing: 1px;")
        
        layout.addWidget(self.image_label)
        layout.addWidget(self.info_label)
        
        self.setStyleSheet("""
            SceneThumbnail {
                background-color: #1A1A1E;
                border: 1px solid #2A2A2E;
                border-radius: 8px;
            }
            SceneThumbnail:hover {
                border: 2px solid #8B5CF6;
                background-color: #1E1E24;
            }
        """)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            main_window = self.window()
            if hasattr(main_window, 'add_to_timeline'):
                main_window.add_to_timeline(self.scene_data)

class TimelineDelegate(QStyledItemDelegate):
    def __init__(self, parent=None):
        super().__init__(parent)
        icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons", "delete.png")
        self.delete_pixmap = QPixmap(icon_path).scaled(24, 24, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation)

    def paint(self, painter, option, index):
        super().paint(painter, option, index)
        rect = option.rect
        delete_rect = QRect(rect.right() - 40, rect.top() + (rect.height() - 24) // 2, 24, 24)
        painter.drawPixmap(delete_rect.topLeft(), self.delete_pixmap)

    def editorEvent(self, event, model, option, index):
        if event.type() == QEvent.Type.MouseButtonRelease:
            rect = option.rect
            delete_rect = QRect(rect.right() - 40, rect.top() + (rect.height() - 24) // 2, 24, 24)
            if delete_rect.contains(event.pos()):
                model.removeRow(index.row())
                return True
        return super().editorEvent(event, model, option, index)

class TimelineListWidget(QListWidget):
    def keyPressEvent(self, event):
        if event.key() in (Qt.Key.Key_Delete, Qt.Key.Key_Backspace):
            for item in self.selectedItems():
                self.takeItem(self.row(item))
        else:
            super().keyPressEvent(event)

class MainWindow(BinaryBackgroundCanvas):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Fracture")
        icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons", "view.png")
        self.setWindowIcon(QIcon(icon_path))
        self.resize(1280, 800)
        
        self.video_path = None
        self.scenes_data = []
        self.timeline_scenes = []
        
        self.init_ui()
        self.apply_styles()

    def init_ui(self):
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(50, 40, 50, 40)
        main_layout.setSpacing(24)
        
        top_bar = QHBoxLayout()
        self.import_btn = QPushButton("IMPORT VIDEO")
        self.import_btn.clicked.connect(self.import_video)
        self.add_glow_effect(self.import_btn)
        
        self.export_btn = QPushButton("MERGE & EXPORT")
        self.export_btn.clicked.connect(self.export_timeline)
        self.export_btn.setEnabled(False)
        self.add_glow_effect(self.export_btn)
        
        top_bar.addWidget(self.import_btn)
        top_bar.addStretch()
        top_bar.addWidget(self.export_btn)
        
        main_layout.addLayout(top_bar)
        
        self.status_label = QLabel("READY")
        self.status_label.setStyleSheet("color: #6B7280; font-size: 10px; font-weight: 700; letter-spacing: 2px;")
        self.progress_bar = QProgressBar()
        self.progress_bar.setValue(0)
        self.progress_bar.setTextVisible(False)
        self.progress_bar.setFixedHeight(4)
        self.progress_bar.hide()
        self.status_label.hide()
        
        progress_layout = QVBoxLayout()
        progress_layout.setSpacing(8)
        progress_layout.addWidget(self.status_label, alignment=Qt.AlignmentFlag.AlignCenter)
        progress_layout.addWidget(self.progress_bar)
        main_layout.addLayout(progress_layout)
        
        self.splitter = QSplitter(Qt.Orientation.Vertical)
        self.splitter.setChildrenCollapsible(False)
        
        self.media_pool_widget = QWidget()
        media_pool_layout = QVBoxLayout(self.media_pool_widget)
        media_pool_layout.setContentsMargins(0, 0, 0, 0)
        
        pool_title = QLabel("MEDIA POOL")
        pool_title.setStyleSheet("color: #F9FAFB; font-size: 12px; font-weight: 700; letter-spacing: 2px;")
        media_pool_layout.addWidget(pool_title)
        
        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.verticalScrollBar().setSingleStep(20)
        self.scroll_content = QWidget()
        self.scroll_content.setStyleSheet("background: transparent;")
        self.grid_layout = QGridLayout(self.scroll_content)
        self.grid_layout.setSpacing(16)
        self.scroll_area.setWidget(self.scroll_content)
        media_pool_layout.addWidget(self.scroll_area)
        
        self.splitter.addWidget(self.media_pool_widget)
        
        self.timeline_widget = QWidget()
        timeline_layout = QVBoxLayout(self.timeline_widget)
        timeline_layout.setContentsMargins(0, 20, 0, 0)
        
        timeline_title = QLabel("TIMELINE QUEUE")
        timeline_title.setStyleSheet("color: #F9FAFB; font-size: 12px; font-weight: 700; letter-spacing: 2px;")
        timeline_layout.addWidget(timeline_title)
        
        self.timeline_list = TimelineListWidget()
        self.timeline_list.setDragDropMode(QAbstractItemView.DragDropMode.InternalMove)
        self.timeline_list.setIconSize(QSize(120, 67))
        self.timeline_list.setVerticalScrollMode(QAbstractItemView.ScrollMode.ScrollPerPixel)
        self.timeline_list.verticalScrollBar().setSingleStep(15)
        self.timeline_delegate = TimelineDelegate(self.timeline_list)
        self.timeline_list.setItemDelegate(self.timeline_delegate)
        timeline_layout.addWidget(self.timeline_list)
        
        self.splitter.addWidget(self.timeline_widget)
        self.splitter.setSizes([450, 250])
        
        main_layout.addWidget(self.splitter)

    def add_glow_effect(self, widget):
        effect = QGraphicsDropShadowEffect()
        effect.setBlurRadius(15)
        effect.setColor(QColor(139, 92, 246, 60))
        effect.setOffset(0, 0)
        widget.setGraphicsEffect(effect)

    def apply_styles(self):
        self.setStyleSheet("""
            MainWindow {
                background-color: #121214;
            }
            QWidget {
                color: #F9FAFB;
                font-family: "Inter", "Segoe UI", "Helvetica Neue", sans-serif;
            }
            QLabel {
                background: transparent;
            }
            QPushButton {
                background-color: #1A1A1E;
                color: #F9FAFB;
                border: 1px solid #333;
                padding: 10px 24px;
                border-radius: 20px;
                font-weight: 700;
                font-size: 11px;
                letter-spacing: 1px;
            }
            QPushButton:hover {
                border: 1px solid #8B5CF6;
                background-color: #1E1E24;
            }
            QPushButton:disabled {
                background-color: #121214;
                color: #6B7280;
                border: 1px solid #222;
            }
            QProgressBar {
                border: none;
                background-color: #1A1A1E;
                border-radius: 2px;
            }
            QProgressBar::chunk {
                background-color: #8B5CF6;
                border-radius: 2px;
            }
            QListWidget {
                background-color: #1A1A1E;
                border: 1px solid #222;
                border-radius: 8px;
                padding: 12px;
                outline: none;
            }
            QListWidget::item {
                padding: 12px;
                padding-right: 50px;
                background-color: #121214;
                border: 1px solid #222;
                border-radius: 6px;
                margin-bottom: 8px;
                color: #F9FAFB;
            }
            QListWidget::item:selected {
                border: 1px solid #8B5CF6;
                background-color: #1A1A1E;
            }
            QScrollArea {
                border: none;
                background-color: transparent;
            }
            QSplitter::handle {
                background-color: transparent;
            }
        """)

    def import_video(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Import Video", "", "Video Files (*.mp4 *.mkv *.avi *.mov)"
        )
        if file_path:
            self.video_path = file_path
            self.start_analysis()

    def start_analysis(self):
        self.import_btn.setEnabled(False)
        self.export_btn.setEnabled(False)
        self.progress_bar.setValue(0)
        self.progress_bar.show()
        self.status_label.setText("INITIALIZING...")
        self.status_label.show()
        
        for i in reversed(range(self.grid_layout.count())): 
            widget_to_remove = self.grid_layout.itemAt(i).widget()
            if widget_to_remove:
                widget_to_remove.setParent(None)
                
        self.timeline_list.clear()
        self.timeline_scenes.clear()
        
        self.worker = AnalysisWorker(self.video_path)
        self.worker.progress_updated.connect(self.update_progress)
        self.worker.finished_analysis.connect(self.on_analysis_finished)
        self.worker.error_occurred.connect(self.on_analysis_error)
        self.worker.start()

    def update_progress(self, val, msg):
        self.progress_bar.setValue(val)
        self.status_label.setText(msg.upper())

    def on_analysis_finished(self, clustered_scenes):
        self.scenes_data = clustered_scenes
        self.scenes_data.sort(key=lambda x: x['cluster'])
        
        cols = 5
        for i, scene in enumerate(self.scenes_data):
            thumb = SceneThumbnail(scene, self)
            row = i // cols
            col = i % cols
            self.grid_layout.addWidget(thumb, row, col)
            
        self.progress_bar.hide()
        self.status_label.setText("ANALYSIS COMPLETE")
        self.import_btn.setEnabled(True)

    def on_analysis_error(self, error_msg):
        self.progress_bar.hide()
        self.status_label.setText("ERROR")
        self.import_btn.setEnabled(True)
        PremiumNotification("Analysis Error", str(error_msg), is_error=True, parent=self).exec()

    def add_to_timeline(self, scene_data):
        self.timeline_scenes.append(scene_data)
        item = QListWidgetItem()
        item.setText(f"  CLUSTER {scene_data['cluster']}  |  {scene_data['duration']:.2f}S  [START: {scene_data['start_time']:.2f}S]")
        item.setIcon(QIcon(scene_data['frame_path']))
        item.setData(Qt.ItemDataRole.UserRole, scene_data)
        self.timeline_list.addItem(item)
        self.export_btn.setEnabled(True)

    def export_timeline(self):
        if self.timeline_list.count() == 0:
            return
            
        output_path, _ = QFileDialog.getSaveFileName(
            self, "Export Video", "", "MP4 Video (*.mp4)"
        )
        
        if not output_path:
            return
            
        ordered_scenes = []
        for i in range(self.timeline_list.count()):
            item = self.timeline_list.item(i)
            scene = item.data(Qt.ItemDataRole.UserRole)
            ordered_scenes.append(scene)
            
        self.status_label.setText("EXPORTING...")
        self.status_label.show()
        
        try:
            export_video(self.video_path, ordered_scenes, output_path)
            PremiumNotification("Success", "Export completed successfully!", is_error=False, parent=self).exec()
        except Exception as e:
            PremiumNotification("Export Error", str(e), is_error=True, parent=self).exec()
        finally:
            self.status_label.setText("READY")
