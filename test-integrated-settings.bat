@echo off
echo Testing Integrated Settings Menu
echo.
echo This will test the new integrated settings in the navigation bar:
echo.
echo Test Steps:
echo 1. Start the application
echo 2. Click "YouTube Music" in the menu bar
echo 3. Navigate to Settings submenu
echo 4. Test toggling various settings:
echo    - System Integration settings
echo    - Audio and Playback settings  
echo    - Interface and Visual settings
echo    - External Services settings
echo 5. Verify settings are applied immediately
echo 6. Restart app to confirm settings persist
echo.
echo Expected Results:
echo - All settings show current state with checkboxes
echo - Changes apply instantly without restart
echo - Settings persist between app restarts
echo - No separate popup windows (except for Last.fm setup)
echo.
echo Press any key to start the app for testing...
pause > nul

node main.js

echo.
echo Integration test completed!
pause
