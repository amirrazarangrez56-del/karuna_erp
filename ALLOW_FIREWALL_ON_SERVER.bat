@echo off
title Karuna Hotel POS - Open Firewall Ports
cd /d "%~dp0"

:: Check for Administrator permissions and auto-elevate if needed
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [PROMPT] Requesting Administrator Privileges...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

cls
echo ================================================================
echo       ALLOWING LAN / WI-FI CONNECTIONS ON MASTER SERVER PC
echo ================================================================
echo.
echo [1/3] Adding Firewall Rule for Master Database Server (Port 3001)...
netsh advfirewall firewall delete rule name="Karuna Hotel POS DB Server (Port 3001)" >nul 2>&1
netsh advfirewall firewall add rule name="Karuna Hotel POS DB Server (Port 3001)" dir=in action=allow protocol=TCP localport=3001 profile=any >nul

echo [2/3] Adding Firewall Rule for High-Speed UI Service (Port 5173)...
netsh advfirewall firewall delete rule name="Karuna Hotel POS UI (Port 5173)" >nul 2>&1
netsh advfirewall firewall add rule name="Karuna Hotel POS UI (Port 5173)" dir=in action=allow protocol=TCP localport=5173 profile=any >nul

echo [3/3] Allowing Node.js Network Traffic...
for /f "delims=" %%i in ('where node 2^>nul') do (
    netsh advfirewall firewall delete rule name="Karuna Node Engine" >nul 2>&1
    netsh advfirewall firewall add rule name="Karuna Node Engine" dir=in action=allow program="%%i" profile=any >nul
)

echo.
echo ================================================================
echo ✅ SUCCESS: Firewall is now OPEN for Port 3001 and Port 5173!
echo All other counter laptops can now connect and sync in real-time.
echo ================================================================
echo.
pause
