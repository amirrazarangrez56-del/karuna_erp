@echo off
title Create Desktop Shortcut - Master Server
cd /d "%~dp0"
cls
echo Creating 'Karuna Hotel POS (Owner)' Shortcut on your Windows Desktop...

powershell -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Karuna Hotel POS (Owner).lnk'); $s.TargetPath = '%~dp0START_OWNER_DESKTOP_SERVER.bat'; $s.WorkingDirectory = '%~dp0'; $s.WindowStyle = 1; $s.Save()"

echo.
echo ================================================================
echo [DONE] 'Karuna Hotel POS (Owner)' shortcut created on Desktop!
echo Staff can now double-click the icon on Desktop to start daily.
echo ================================================================
echo.
pause
