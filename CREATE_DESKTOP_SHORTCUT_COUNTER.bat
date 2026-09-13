@echo off
title Create Desktop Shortcut - Billing Counter
cd /d "%~dp0"
cls
echo Creating 'Karuna Hotel POS (Billing)' Shortcut on your Windows Desktop...

powershell -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Karuna Hotel POS (Billing).lnk'); $s.TargetPath = '%~dp0START_COUNTER_LAPTOP.bat'; $s.WorkingDirectory = '%~dp0'; $s.WindowStyle = 1; $s.Save()"

echo.
echo ================================================================
echo [DONE] 'Karuna Hotel POS (Billing)' shortcut created on Desktop!
echo Cashiers can now double-click the icon on Desktop to start billing.
echo ================================================================
echo.
pause
