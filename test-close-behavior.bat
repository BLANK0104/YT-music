@echo off
echo Testing Close Behavior
echo.
echo This will test the app close behavior:
echo - With system tray enabled: should minimize to tray
echo - With system tray disabled: should close completely
echo.
echo Press any key to start the app for testing...
pause > nul

node main.js

echo.
echo Test completed!
pause
