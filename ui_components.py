import os
import math
import time
import tempfile
import cv2
import yt_dlp
from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QFileDialog, QProgressBar, QListWidget, QListWidgetItem,
    QScrollArea, QGridLayout, QSplitter, QStyleOption, QStyle, QDialog,
    QStyledItemDelegate, QLineEdit, QFrame, QAbstractItemView, QGraphicsDropShadowEffect, QStatusBar, QComboBox, QFormLayout
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal, QSize, QTimer, QRect, QEvent
from PyQt6.QtGui import QPixmap, QIcon, QColor, QPainter, QFont, QImage

from video_processor import detect_scenes_and_extract_frames
from ml_engine import MLEngine
from exporter import export_video

def get_stylesheet(is_dark_mode):
    bg = "#09090B" if is_dark_mode else "#F4F4F5"
    panel = "#18181B" if is_dark_mode else "#FFFFFF"
    border = "#27272A" if is_dark_mode else "#E4E4E7"
    input_border = "#3F3F46" if is_dark_mode else "#D4D4D8"
    text = "#FAFAFA" if is_dark_mode else "#09090B"
    muted = "#A1A1AA" if is_dark_mode else "#71717A"
    primary = "#2563EB"
    primary_hover = "#3B82F6"
    btn_bg = "#27272A" if is_dark_mode else "#F4F4F5"
    btn_hover = "#3F3F46" if is_dark_mode else "#E4E4E7"
    
    return f"""
        QMainWindow, QDialog {{
            background-color: {bg};
        }}
        QWidget {{
            font-family: "Segoe UI", "Helvetica Neue", sans-serif;
            color: {text};
        }}
        #Toolbar, #PanelFrame {{
            background-color: {panel};
            border: 1px solid {border};
            border-radius: 6px;
        }}
        #PanelTitle {{
            color: {text};
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 5px;
        }}
        QLineEdit {{
            background-color: {bg};
            border: 1px solid {input_border};
            border-radius: 4px;
            padding: 6px 12px;
            color: {text};
            font-size: 12px;
        }}
        QLineEdit:focus {{
            border: 1px solid {primary};
        }}
        QPushButton {{
            padding: 6px 16px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 12px;
        }}
        QPushButton#PrimaryButton {{
            background-color: {primary};
            color: white;
            border: 1px solid {primary};
        }}
        QPushButton#PrimaryButton:hover {{
            background-color: {primary_hover};
        }}
        QPushButton#PrimaryButton:disabled {{
            background-color: {panel};
            color: {muted};
            border: 1px solid {input_border};
        }}
        QPushButton#SecondaryButton, QPushButton#SettingsButton {{
            background-color: {btn_bg};
            color: {text};
            border: 1px solid {input_border};
        }}
        QPushButton#SecondaryButton:hover, QPushButton#SettingsButton:hover {{
            background-color: {btn_hover};
            border: 1px solid {muted};
        }}
        QPushButton#SecondaryButton:disabled {{
            background-color: {panel};
            color: {muted};
        }}
        QProgressBar {{
            border: none;
            background-color: {btn_bg};
            border-radius: 4px;
        }}
        QProgressBar::chunk {{
            background-color: {primary};
            border-radius: 4px;
        }}
        QListWidget {{
            background-color: {bg};
            border: 1px solid {border};
            border-radius: 4px;
            padding: 8px;
            outline: none;
        }}
        QListWidget::item {{
            padding: 8px;
            padding-right: 40px;
            background-color: {panel};
            border: 1px solid {border};
            border-radius: 4px;
            margin-bottom: 4px;
            color: {text};
            font-size: 12px;
        }}
        QListWidget::item:selected {{
            border: 1px solid {primary};
            background-color: {btn_bg};
        }}
        QScrollArea {{
            border: none;
            background-color: transparent;
        }}
        QSplitter::handle {{
            background-color: transparent;
        }}
        QStatusBar {{
            background-color: {panel};
            color: {muted};
            border-top: 1px solid {border};
        }}
        SceneThumbnail {{
            background-color: {panel};
            border: 1px solid {input_border};
            border-radius: 4px;
        }}
        SceneThumbnail:hover {{
            border: 1px solid {primary};
            background-color: {btn_hover};
        }}
    """

class PremiumNotification(QDialog):
    def __init__(self, title, message, is_error=False, parent=None, is_dark_mode=True):
        super().__init__(parent)
        self.setWindowTitle(title)
        self.setFixedSize(400, 200)
        self.setWindowFlags(Qt.WindowType.Dialog | Qt.WindowType.FramelessWindowHint)
        self.setStyleSheet(get_stylesheet(is_dark_mode))
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(30, 30, 30, 30)
        layout.setSpacing(15)
        
        border_color = "#EF4444" if is_error else "#2563EB"
        title_label = QLabel(title)
        title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title_label.setStyleSheet(f"color: {border_color}; font-size: 14px; font-weight: bold;")
        layout.addWidget(title_label)
        
        msg_label = QLabel(message)
        msg_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        msg_label.setWordWrap(True)
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
    def __init__(self, parent=None, is_dark_mode=True):
        super().__init__(parent)
        self.setWindowTitle("Settings")
        self.setFixedSize(300, 150)
        self.is_dark = is_dark_mode
        self.setStyleSheet(get_stylesheet(is_dark_mode))
        
        layout = QFormLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(15)
        
        self.theme_combo = QComboBox()
        self.theme_combo.addItems(["Dark Mode", "Light Mode"])
        self.theme_combo.setCurrentIndex(0 if is_dark_mode else 1)
        self.theme_combo.setStyleSheet("""
            QComboBox { padding: 4px; border-radius: 4px; }
        """)
        
        layout.addRow("Theme Interface:", self.theme_combo)
        
        btn_layout = QHBoxLayout()
        apply_btn = QPushButton("Apply")
        apply_btn.setObjectName("PrimaryButton")
        apply_btn.clicked.connect(self.apply_settings)
        
        close_btn = QPushButton("Close")
        close_btn.setObjectName("SecondaryButton")
        close_btn.clicked.connect(self.reject)
        
        btn_layout.addStretch()
        btn_layout.addWidget(close_btn)
        btn_layout.addWidget(apply_btn)
        
        layout.addRow(btn_layout)
        
    def apply_settings(self):
        self.is_dark = self.theme_combo.currentIndex() == 0
        self.accept()

class DownloadWorker(QThread):
    progress_updated = pyqtSignal(int, str)
    finished_download = pyqtSignal(str)
    error_occurred = pyqtSignal(str)
    
    def __init__(self, url):
        super().__init__()
        self.url = url
        
    def run(self):
        try:
            download_dir = os.path.join(tempfile.gettempdir(), 'fracture_downloads')
            os.makedirs(download_dir, exist_ok=True)
            
            def my_hook(d):
                if d['status'] == 'downloading':
                    try:
                        p = d.get('_percent_str', '0%')
                        p_clean = p.replace('%', '').strip()
                        self.progress_updated.emit(int(float(p_clean)), f"Downloading: {p}")
                    except Exception:
                        self.progress_updated.emit(0, "Downloading...")
                elif d['status'] == 'finished':
                    self.progress_updated.emit(100, "Download Finished. Processing...")
            
            ydl_opts = {
                'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                'outtmpl': os.path.join(download_dir, '%(id)s.%(ext)s'),
                'progress_hooks': [my_hook],
                'quiet': True,
                'no_warnings': True,
                'concurrent_fragment_downloads': 15 # Massively speed up DASH downloads
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(self.url, download=True)
                filename = ydl.prepare_filename(info)
                self.finished_download.emit(filename)
                
        except Exception as e:
            self.error_occurred.emit(str(e))

class PreviewWorker(QThread):
    frame_ready = pyqtSignal(QPixmap)
    
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
            if fps <= 0 or math.isnan(fps): fps = 30.0
            
            start_frame = int(self.start_time * fps)
            cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
            
            max_frames = int(min(3.0, self.duration) * fps)
            
            for _ in range(max_frames):
                if not self.running:
                    break
                ret, frame = cap.read()
                if not ret: break
                
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                h, w, ch = frame.shape
                bytes_per_line = ch * w
                qt_img = QImage(frame.data, w, h, bytes_per_line, QImage.Format.Format_RGB888)
                pixmap = QPixmap.fromImage(qt_img).scaled(160, 90, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation)
                
                self.frame_ready.emit(pixmap)
                time.sleep(1.0 / fps)
                
            cap.release()
        except Exception:
            pass

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

class SceneThumbnail(QFrame):
    def __init__(self, scene_data, video_path, parent=None):
        super().__init__(parent)
        self.scene_data = scene_data
        self.video_path = video_path
        
        self.original_pixmap = QPixmap(scene_data['frame_path']).scaled(160, 90, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation)
        self.preview_worker = None
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(6, 6, 6, 6)
        layout.setSpacing(6)
        
        self.image_label = QLabel()
        self.image_label.setPixmap(self.original_pixmap)
        self.image_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        self.info_label = QLabel(f"Cluster {scene_data['cluster']}  |  {scene_data['duration']:.1f}s")
        self.info_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        layout.addWidget(self.image_label)
        layout.addWidget(self.info_label)

    def enterEvent(self, event):
        super().enterEvent(event)
        if self.preview_worker and self.preview_worker.isRunning():
            return
        self.preview_worker = PreviewWorker(self.video_path, self.scene_data['start_time'], self.scene_data['duration'])
        self.preview_worker.frame_ready.connect(self.update_image)
        self.preview_worker.start()
        
    def leaveEvent(self, event):
        super().leaveEvent(event)
        if self.preview_worker:
            self.preview_worker.running = False
            self.preview_worker.wait()
            try:
                self.preview_worker.frame_ready.disconnect()
            except TypeError:
                pass
            self.preview_worker = None
        self.image_label.setPixmap(self.original_pixmap)

    def update_image(self, pixmap):
        self.image_label.setPixmap(pixmap)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            main_window = self.window()
            if hasattr(main_window, 'add_to_timeline'):
                main_window.add_to_timeline(self.scene_data)

class TimelineDelegate(QStyledItemDelegate):
    def __init__(self, parent=None):
        super().__init__(parent)
        icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons", "delete.png")
        self.delete_pixmap = QPixmap(icon_path).scaled(16, 16, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation)

    def paint(self, painter, option, index):
        super().paint(painter, option, index)
        rect = option.rect
        delete_rect = QRect(rect.right() - 32, rect.top() + (rect.height() - 16) // 2, 16, 16)
        painter.drawPixmap(delete_rect.topLeft(), self.delete_pixmap)

    def editorEvent(self, event, model, option, index):
        if event.type() == QEvent.Type.MouseButtonRelease:
            rect = option.rect
            delete_rect = QRect(rect.right() - 32, rect.top() + (rect.height() - 16) // 2, 16, 16)
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

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Fracture - Pro Video Editor")
        icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons", "view.png")
        self.setWindowIcon(QIcon(icon_path))
        self.resize(1280, 800)
        
        self.video_path = None
        self.scenes_data = []
        self.timeline_scenes = []
        self.is_dark_mode = True
        
        self.init_ui()
        self.apply_styles()

    def init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(20, 20, 20, 10)
        main_layout.setSpacing(16)
        
        toolbar_frame = QFrame()
        toolbar_frame.setObjectName("Toolbar")
        toolbar_layout = QHBoxLayout(toolbar_frame)
        toolbar_layout.setContentsMargins(15, 15, 15, 15)
        toolbar_layout.setSpacing(15)
        
        self.import_btn = QPushButton("Import Local Video")
        self.import_btn.setObjectName("PrimaryButton")
        self.import_btn.clicked.connect(self.import_video)
        
        self.settings_btn = QPushButton("⚙ Settings")
        self.settings_btn.setObjectName("SettingsButton")
        self.settings_btn.clicked.connect(self.open_settings)
        
        self.export_btn = QPushButton("Merge & Export Timeline")
        self.export_btn.setObjectName("PrimaryButton")
        self.export_btn.clicked.connect(self.export_timeline)
        self.export_btn.setEnabled(False)
        
        toolbar_layout.addWidget(self.import_btn)
        toolbar_layout.addStretch()
        toolbar_layout.addWidget(self.settings_btn)
        toolbar_layout.addWidget(self.export_btn)
        
        main_layout.addWidget(toolbar_frame)
        
        self.splitter = QSplitter(Qt.Orientation.Vertical)
        self.splitter.setChildrenCollapsible(False)
        
        self.media_pool_widget = QFrame()
        self.media_pool_widget.setObjectName("PanelFrame")
        media_pool_layout = QVBoxLayout(self.media_pool_widget)
        media_pool_layout.setContentsMargins(15, 15, 15, 15)
        
        pool_title = QLabel("Media Pool")
        pool_title.setObjectName("PanelTitle")
        media_pool_layout.addWidget(pool_title)
        
        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.verticalScrollBar().setSingleStep(20)
        self.scroll_content = QWidget()
        self.scroll_content.setStyleSheet("background: transparent;")
        self.grid_layout = QGridLayout(self.scroll_content)
        self.grid_layout.setSpacing(12)
        self.grid_layout.setAlignment(Qt.AlignmentFlag.AlignTop | Qt.AlignmentFlag.AlignLeft)
        self.scroll_area.setWidget(self.scroll_content)
        media_pool_layout.addWidget(self.scroll_area)
        
        self.splitter.addWidget(self.media_pool_widget)
        
        self.timeline_widget = QFrame()
        self.timeline_widget.setObjectName("PanelFrame")
        timeline_layout = QVBoxLayout(self.timeline_widget)
        timeline_layout.setContentsMargins(15, 15, 15, 15)
        
        timeline_title = QLabel("Timeline Assembly")
        timeline_title.setObjectName("PanelTitle")
        timeline_layout.addWidget(timeline_title)
        
        self.timeline_list = TimelineListWidget()
        self.timeline_list.setDragDropMode(QAbstractItemView.DragDropMode.InternalMove)
        self.timeline_list.setIconSize(QSize(90, 50))
        self.timeline_list.setVerticalScrollMode(QAbstractItemView.ScrollMode.ScrollPerPixel)
        self.timeline_list.verticalScrollBar().setSingleStep(15)
        self.timeline_delegate = TimelineDelegate(self.timeline_list)
        self.timeline_list.setItemDelegate(self.timeline_delegate)
        timeline_layout.addWidget(self.timeline_list)
        
        self.splitter.addWidget(self.timeline_widget)
        self.splitter.setSizes([450, 250])
        
        main_layout.addWidget(self.splitter)
        
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        
        self.status_label = QLabel(" Ready")
        self.progress_bar = QProgressBar()
        self.progress_bar.setFixedWidth(200)
        self.progress_bar.setFixedHeight(8)
        self.progress_bar.setTextVisible(False)
        self.progress_bar.hide()
        
        self.status_bar.addWidget(self.status_label)
        self.status_bar.addPermanentWidget(self.progress_bar)

    def apply_styles(self):
        self.setStyleSheet(get_stylesheet(self.is_dark_mode))

    def open_settings(self):
        dialog = SettingsDialog(self, self.is_dark_mode)
        if dialog.exec():
            self.is_dark_mode = dialog.is_dark
            self.apply_styles()

    def closeEvent(self, event):
        if hasattr(self, 'dl_worker') and self.dl_worker and self.dl_worker.isRunning():
            self.dl_worker.terminate()
            self.dl_worker.wait()
        if hasattr(self, 'worker') and self.worker and self.worker.isRunning():
            self.worker.terminate()
            self.worker.wait()
        event.accept()

    def download_video(self):
        url = self.url_input.text().strip()
        if not url: return
        
        self.import_btn.setEnabled(False)
        self.download_btn.setEnabled(False)
        self.url_input.setEnabled(False)
        self.export_btn.setEnabled(False)
        self.settings_btn.setEnabled(False)
        
        self.progress_bar.setValue(0)
        self.progress_bar.show()
        self.status_label.setText(" Fetching remote media...")
        
        self.dl_worker = DownloadWorker(url)
        self.dl_worker.progress_updated.connect(self.update_progress)
        self.dl_worker.finished_download.connect(self.on_download_finished)
        self.dl_worker.error_occurred.connect(self.on_analysis_error)
        self.dl_worker.start()
        
    def on_download_finished(self, downloaded_path):
        self.video_path = downloaded_path
        self.download_btn.setEnabled(True)
        self.url_input.setEnabled(True)
        self.settings_btn.setEnabled(True)
        self.url_input.clear()
        self.start_analysis()

    def import_video(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Import Media", "", "Video Files (*.mp4 *.mkv *.avi *.mov)"
        )
        if file_path:
            self.video_path = file_path
            self.start_analysis()

    def start_analysis(self):
        self.import_btn.setEnabled(False)
        self.export_btn.setEnabled(False)
        self.settings_btn.setEnabled(False)
        
        self.progress_bar.setValue(0)
        self.progress_bar.show()
        self.status_label.setText(" Analyzing scenes...")
        
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
        self.status_label.setText(f" {msg}")

    def on_analysis_finished(self, clustered_scenes):
        self.scenes_data = clustered_scenes
        self.scenes_data.sort(key=lambda x: x['cluster'])
        
        cols = 6
        for i, scene in enumerate(self.scenes_data):
            thumb = SceneThumbnail(scene, self.video_path, self)
            row = i // cols
            col = i % cols
            self.grid_layout.addWidget(thumb, row, col)
            
        self.progress_bar.hide()
        self.status_label.setText(" Analysis complete. Ready.")
        self.import_btn.setEnabled(True)
        self.settings_btn.setEnabled(True)

    def on_analysis_error(self, error_msg):
        self.progress_bar.hide()
        self.status_label.setText(" Error during execution.")
        self.import_btn.setEnabled(True)
        self.settings_btn.setEnabled(True)
        PremiumNotification("System Error", str(error_msg), is_error=True, parent=self, is_dark_mode=self.is_dark_mode).exec()

    def add_to_timeline(self, scene_data):
        self.timeline_scenes.append(scene_data)
        item = QListWidgetItem()
        item.setText(f"  Cluster {scene_data['cluster']}  |  {scene_data['duration']:.2f}s  [T: {scene_data['start_time']:.2f}s]")
        item.setIcon(QIcon(scene_data['frame_path']))
        item.setData(Qt.ItemDataRole.UserRole, scene_data)
        self.timeline_list.addItem(item)
        self.export_btn.setEnabled(True)

    def export_timeline(self):
        if self.timeline_list.count() == 0:
            return
            
        output_path, _ = QFileDialog.getSaveFileName(
            self, "Export Render", "", "MP4 Video (*.mp4)"
        )
        
        if not output_path:
            return
            
        ordered_scenes = []
        for i in range(self.timeline_list.count()):
            item = self.timeline_list.item(i)
            scene = item.data(Qt.ItemDataRole.UserRole)
            ordered_scenes.append(scene)
            
        self.status_label.setText(" Rendering timeline export...")
        self.progress_bar.show()
        
        try:
            export_video(self.video_path, ordered_scenes, output_path)
            PremiumNotification("Render Complete", "Export completed successfully.", is_error=False, parent=self, is_dark_mode=self.is_dark_mode).exec()
        except Exception as e:
            PremiumNotification("Render Error", str(e), is_error=True, parent=self, is_dark_mode=self.is_dark_mode).exec()
        finally:
            self.status_label.setText(" Ready.")
            self.progress_bar.hide()
