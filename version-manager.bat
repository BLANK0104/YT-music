@echo off
echo.
echo ====================================================
echo  🎵 YouTube Music Desktop - Version Manager
echo ====================================================
echo.
echo Choose which version to use:
echo.
echo 1. 🎨 Glass UI Edition (Default - Recommended)
echo    ✨ Glass morphism UI, Inactivity bypass, Modular architecture
echo.
echo 2. 📦 Legacy Version (Original Monolithic)
echo    ⚠️  Missing latest features, Single file architecture
echo.
echo 3. 🔄 Compare Both Versions
echo    Test side by side to see the differences
echo.
echo 4. ❌ Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo 🎨 Starting Glass UI Edition (Default)...
    echo ✨ Features: Glass UI, Inactivity Bypass, Modular Architecture
    echo.
    start.bat
    goto end
)

if "%choice%"=="2" (
    echo.
    echo 📦 Starting Legacy Version...
    echo ⚠️  Note: Missing latest features like Glass UI and Inactivity Bypass
    echo.
    start-legacy.bat
    goto end
)

if "%choice%"=="3" (
    echo.
    echo 🔄 Testing both versions for comparison...
    echo.
    echo Starting Glass UI Edition first...
    timeout /t 2 /nobreak >nul
    start "Glass UI Edition" cmd /c start.bat
    echo.
    echo Starting Legacy Version second...
    timeout /t 2 /nobreak >nul
    start "Legacy Version" cmd /c start-legacy.bat
    echo.
    echo ✅ Both versions launched! Compare the differences.
    echo 💡 The Glass UI Edition includes modern features and better architecture.
    goto end
)

if "%choice%"=="4" (
    echo.
    echo 👋 Goodbye!
    goto end
)

echo.
echo ❌ Invalid choice. Please run the script again.

:end
echo.
pause
