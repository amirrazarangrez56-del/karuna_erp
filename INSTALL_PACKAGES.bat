@echo off
title Karuna Hotel POS - Auto Installer
cd /d "%~dp0"
cls
echo ================================================================
echo        KARUNA HOTEL POS - AUTOMATIC PACKAGE INSTALLER
echo ================================================================
echo.
echo Installing all required software components (node_modules)...
echo Please make sure your internet / Wi-Fi is connected.
echo.
echo Please wait 1 to 2 minutes...
echo.

call npm install

if %errorlevel% equ 0 (
    echo.
    echo ================================================================
    echo [SUCCESS] node_modules installed successfully!
    echo You can now run START_OWNER_DESKTOP_SERVER.bat or START_COUNTER_LAPTOP.bat
    echo ================================================================
) else (
    echo.
    echo ================================================================
    echo [ERROR] Failed to install. Please check your internet connection.
    echo If this PC has no internet, you can copy the 'node_modules' 
    echo folder from your first PC using a USB Pen Drive.
    echo ================================================================
)

echo.
pause
