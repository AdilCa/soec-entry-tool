@echo off
rem SOEC 录入工具启动器（Windows）：双击即用，关闭窗口即停止
chcp 65001 >nul
cd /d %~dp0
py -3 start.py 2>nul || python start.py
pause
