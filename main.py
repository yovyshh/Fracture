import logging
import os
import sys
from logging.handlers import RotatingFileHandler

from PyQt6.QtWidgets import QApplication

from ui_components import MainWindow


def setup_logging():
    log_dir = os.path.join(os.path.expanduser("~"), ".fracture")
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, "fracture.log")

    root = logging.getLogger()
    root.setLevel(logging.INFO)

    fmt = logging.Formatter(
        "%(asctime)s  %(levelname)-7s  %(name)s  %(message)s",
        datefmt="%H:%M:%S",
    )

    fh = RotatingFileHandler(log_path, maxBytes=2_000_000, backupCount=3, encoding="utf-8")
    fh.setFormatter(fmt)
    fh.setLevel(logging.INFO)
    root.addHandler(fh)

    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(fmt)
    sh.setLevel(logging.INFO)
    root.addHandler(sh)

    logging.getLogger(__name__).info("Logging to %s", log_path)


def main():
    setup_logging()
    app = QApplication(sys.argv)
    app.setApplicationName("Fracture")
    app.setOrganizationName("Fracture")
    app.setStyle("Fusion")

    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
