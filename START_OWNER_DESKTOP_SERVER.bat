@echo off
title Karuna Hotel POS - Master Server and Owner Desktop Terminal
cd /d "%~dp0"
cls
echo ================================================================
echo        KARUNA HOTEL POS - MASTER SERVER AND DESKTOP SUITE
echo             (OFFLINE-FIRST LAN HOTEL ERP ENGINE)
echo ================================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 goto :NO_NODE

:: 2. Check node_modules packages
if not exist "node_modules\express" goto :INSTALL_PACKAGES
goto :RUN_SERVER

:NO_NODE
echo ================================================================
echo [ERROR] Node.js is NOT installed on this computer!
echo Please install Node.js from https://nodejs.org
echo ================================================================
pause
exit /b 1

:INSTALL_PACKAGES
echo [SETUP] Required software packages are missing.
echo Installing packages now...
echo.
call npm install
if not exist "node_modules\express" goto :INSTALL_FAILED
goto :RUN_SERVER

:INSTALL_FAILED
echo.
echo ================================================================
echo [ERROR] Package installation failed!
echo.
echo SOLUTION:
echo Copy the complete node_modules folder from your working laptop
echo into this folder: %~dp0
echo ================================================================
pause
exit /b 1

:RUN_SERVER
echo [1] Master Server Network IP Addresses:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    echo     * Master LAN IP: %%a
)
echo.

:: 3. Launch unified Node Desktop Launcher
call node launcher.js

echo.
echo Server session ended.
pause

