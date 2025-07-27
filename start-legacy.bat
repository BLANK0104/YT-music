@echo off
echo.
echo ====================================================
echo  🎵 YouTube Music Desktop App - Legacy Version
echo ====================================================
echo.

echo 🚀 Starting YouTube Music (Original Monolithic Version)...
echo ⚠️  Note: This is the legacy version. Use start.bat for the new Glass UI.
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo ⚠️  Dependencies not found. Installing...
    npm install
    echo.
)

REM Start the legacy app
echo 📦 Launching legacy monolithic version...
node main-backup.js

echo.
echo 👋 Legacy app closed. Consider upgrading to the Glass UI version!
pause
