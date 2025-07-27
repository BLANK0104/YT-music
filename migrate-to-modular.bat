@echo off
echo ========================================
echo   YouTube Music Desktop - Migration
echo ========================================
echo.
echo This script will help you migrate to the new modular architecture.
echo.
echo Current Structure: Single main.js file (2600+ lines)
echo New Structure: Modular architecture with organized files
echo.
echo Benefits:
echo  ✓ Better code organization
echo  ✓ Easier maintenance and debugging  
echo  ✓ Improved scalability
echo  ✓ Cleaner separation of concerns
echo  ✓ All existing features preserved
echo.

:menu
echo Choose an option:
echo.
echo 1. Test NEW modular version
echo 2. Run ORIGINAL version (current)
echo 3. Compare file structures
echo 4. View migration benefits
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto test_modular
if "%choice%"=="2" goto run_original
if "%choice%"=="3" goto compare_structure
if "%choice%"=="4" goto view_benefits
if "%choice%"=="5" goto exit
goto invalid

:test_modular
echo.
echo 🚀 Starting NEW modular version...
echo.
echo Features to test:
echo  • All menu functionality
echo  • Settings integration
echo  • System tray
echo  • Global shortcuts
echo  • Mini player
echo  • Audio enhancements
echo.
echo Press any key to continue...
pause > nul
npm run start:modular
goto menu

:run_original
echo.
echo 🔄 Starting ORIGINAL version...
echo.
npm start
goto menu

:compare_structure
echo.
echo 📁 FILE STRUCTURE COMPARISON
echo.
echo ORIGINAL (Monolithic):
echo   main.js              (2600+ lines - everything)
echo   preload.js
echo   settings.html
echo   mini-player.html
echo.
echo NEW (Modular):
echo   main-new.js          (150 lines - entry point)
echo   src/
echo   ├── utils/
echo   │   ├── constants.js     (App constants)
echo   │   ├── state.js         (State management)
echo   │   └── dependencies.js  (Optional deps)
echo   ├── windows/
echo   │   ├── MainWindow.js    (Main window)
echo   │   ├── SettingsWindow.js (Settings)
echo   │   └── MiniPlayerWindow.js (Mini player)
echo   ├── menu/
echo   │   └── MenuManager.js   (Menu system)
echo   ├── modules/
echo   │   ├── TrayManager.js   (System tray)
echo   │   ├── GlobalShortcuts.js (Shortcuts)
echo   │   ├── AudioEnhancer.js (Audio features)
echo   │   └── ThemeManager.js  (Themes)
echo   └── services/
echo       ├── AdBlocker.js     (Ad blocking)
echo       ├── IPCHandler.js    (Communication)
echo       ├── DiscordService.js (Discord RPC)
echo       └── LastfmService.js (Last.fm)
echo.
pause
goto menu

:view_benefits
echo.
echo ✨ MIGRATION BENEFITS
echo.
echo 🔧 MAINTAINABILITY:
echo   • Each module has single responsibility
echo   • Easy to debug specific features
echo   • Individual modules can be tested
echo.
echo 📖 READABILITY:
echo   • Clear structure and organization
echo   • Reduced complexity per file
echo   • Better documentation possible
echo.
echo 🚀 SCALABILITY:
echo   • Easy to add new features
echo   • Flexible configuration
echo   • Plugin architecture ready
echo.
echo 🎯 CODE QUALITY:
echo   • Separation of concerns
echo   • Reusable components
echo   • Consistent patterns
echo.
echo 🛡️ RISK MITIGATION:
echo   • Original main.js preserved as backup
echo   • All settings maintained
echo   • Feature parity guaranteed
echo   • Gradual migration possible
echo.
pause
goto menu

:invalid
echo.
echo ❌ Invalid choice. Please enter 1-5.
echo.
goto menu

:exit
echo.
echo 👋 Migration assistant closed.
echo.
echo To switch to modular architecture permanently:
echo   1. Test thoroughly with: npm run start:modular
echo   2. Update package.json main field to: main-new.js
echo   3. Rename main.js to main-backup.js
echo   4. Rename main-new.js to main.js
echo.
pause
