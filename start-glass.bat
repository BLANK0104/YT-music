@echo off
echo.
echo ====================================================
echo  🎵 YouTube Music Desktop App - Glass UI Testing
echo ====================================================
echo.

echo 🚀 Starting YouTube Music with modern glass effects...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo ⚠️  Dependencies not found. Installing...
    npm install
    echo.
)

REM Start the app with glass UI enabled
echo ✨ Launching with glass morphism UI enhancements...
node main-new.js

echo.
echo 👋 App closed. Thank you for testing!
pause
