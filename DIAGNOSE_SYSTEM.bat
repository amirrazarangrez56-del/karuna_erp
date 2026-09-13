@echo off
title Karuna Hotel POS - System Diagnostic
cd /d "%~dp0"
cls
echo ================================================================
echo         KARUNA HOTEL POS - SYSTEM DIAGNOSTIC TOOL
echo ================================================================
echo.

echo [1] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node -v') do echo     Node.js Version: %%i [OK]
) else (
    echo     [FAIL] Node.js is NOT installed! Please download from https://nodejs.org
)

echo.
echo [2] Checking NPM installation...
where npm >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm -v') do echo     NPM Version: %%i [OK]
) else (
    echo     [FAIL] NPM is NOT found!
)

echo.
echo [3] Checking node_modules folder...
if exist "node_modules" (
    echo     node_modules folder: FOUND [OK]
) else (
    echo     [FAIL] node_modules folder is MISSING! Run 'npm install'.
)

echo.
echo [4] Checking Local LAN IP Address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    echo     Found IP: %%a
)

echo.
echo ================================================================
echo Diagnostic complete.
echo ================================================================
pause
