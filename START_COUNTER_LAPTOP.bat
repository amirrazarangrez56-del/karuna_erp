@echo off
title Karuna Hotel POS - Counter Billing Desktop Terminal
cd /d "%~dp0"
cls
echo ================================================================
echo        KARUNA HOTEL POS - COUNTER BILLING DESKTOP SUITE
echo               (STANDALONE NATIVE APPLICATION)
echo ================================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 goto :NO_NODE

:: 2. Check packages (node_modules)
if not exist "node_modules\electron" goto :INSTALL_PACKAGES
goto :CHECK_BUILD

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
if not exist "node_modules\electron" goto :INSTALL_FAILED
goto :CHECK_BUILD

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

:CHECK_BUILD
:: 3. Check production build (dist)
if not exist "dist\index.html" (
    echo [SETUP] Building local standalone POS application...
    call npm run build
)

:: 4. Master Server IP configuration
set SERVER_IP=168.254.36.121
if exist "server_config.json" (
    for /f "delims=" %%i in ('node -e "try{const c=JSON.parse(require('fs').readFileSync('server_config.json'));if(c.serverIp&&c.serverIp!='localhost'&&c.serverIp!='isServer')console.log(c.serverIp)}catch(e){}"') do (
        set SERVER_IP=%%i
    )
)

echo Master Server IP is set to: %SERVER_IP%
echo.
echo Press ENTER to connect to %SERVER_IP%, or type a new Master Server IP:
set /p USER_INPUT="Master IP [%SERVER_IP%]: "
if not "%USER_INPUT%"=="" set SERVER_IP=%USER_INPUT%

echo { "isServer": false, "serverIp": "%SERVER_IP%", "port": 3001 } > "server_config.json"

echo.
echo [1] Master Database Server: %SERVER_IP% (Port 3001 Sync)
echo [2] Launching Standalone POS Desktop Window...
echo.

call node counter_launcher.js "%SERVER_IP%"

pause
