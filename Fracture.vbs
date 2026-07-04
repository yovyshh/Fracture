Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Windows 11 Pro\Videos\Projects\VideoClassifier"
WshShell.Run "pythonw.exe main.py", 0, False
