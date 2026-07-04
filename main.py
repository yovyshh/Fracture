import sys
from PyQt6.QtWidgets import QApplication
from ui_components import MainWindow

def main():
    app = QApplication(sys.argv)
    
    # Ensure styles look somewhat native before our stylesheets
    app.setStyle("Fusion")
    
    window = MainWindow()
    window.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
