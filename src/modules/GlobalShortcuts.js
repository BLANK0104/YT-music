/**
 * Global Shortcuts Management
 */

const { globalShortcut } = require('electron');
const appState = require('../utils/state');
const { appConstants } = require('../utils/constants');

class GlobalShortcuts {
    constructor() {
        this.registeredShortcuts = [];
    }

    register() {
        this.unregisterAll();

        // Media controls with robust DOM selectors
        this.registerShortcut('MediaPlayPause', async () => {
            const mainWindow = appState.getMainWindow();
            if (mainWindow) {
                try {
                    await mainWindow.webContents.executeJavaScript(`
                        const playPauseBtn = document.querySelector('${appConstants.SELECTORS.PLAY_PAUSE}');
                        if (playPauseBtn) {
                            playPauseBtn.click();
                            console.log('Global shortcut: Play/Pause clicked');
                        } else {
                            console.warn('Global shortcut: Play/Pause button not found');
                        }
                    `);
                } catch (error) {
                    console.error('Global shortcut error (Play/Pause):', error);
                }
            }
        });

        this.registerShortcut('MediaNextTrack', async () => {
            const mainWindow = appState.getMainWindow();
            if (mainWindow) {
                try {
                    await mainWindow.webContents.executeJavaScript(`
                        const nextBtn = document.querySelector('${appConstants.SELECTORS.NEXT}');
                        if (nextBtn) {
                            nextBtn.click();
                            console.log('Global shortcut: Next track clicked');
                        } else {
                            console.warn('Global shortcut: Next button not found');
                        }
                    `);
                } catch (error) {
                    console.error('Global shortcut error (Next):', error);
                }
            }
        });

        this.registerShortcut('MediaPreviousTrack', async () => {
            const mainWindow = appState.getMainWindow();
            if (mainWindow) {
                try {
                    await mainWindow.webContents.executeJavaScript(`
                        const prevBtn = document.querySelector('${appConstants.SELECTORS.PREVIOUS}');
                        if (prevBtn) {
                            prevBtn.click();
                            console.log('Global shortcut: Previous track clicked');
                        } else {
                            console.warn('Global shortcut: Previous button not found');
                        }
                    `);
                } catch (error) {
                    console.error('Global shortcut error (Previous):', error);
                }
            }
        });
        
        console.log('🎹 Global media shortcuts enabled with robust selectors');
    }

    registerShortcut(accelerator, callback) {
        try {
            const success = globalShortcut.register(accelerator, callback);
            if (success) {
                this.registeredShortcuts.push(accelerator);
                console.log(`✅ Registered global shortcut: ${accelerator}`);
            } else {
                console.warn(`❌ Failed to register global shortcut: ${accelerator}`);
            }
        } catch (error) {
            console.error(`Error registering global shortcut ${accelerator}:`, error);
        }
    }

    unregisterAll() {
        this.registeredShortcuts.forEach(shortcut => {
            try {
                globalShortcut.unregister(shortcut);
                console.log(`🔓 Unregistered global shortcut: ${shortcut}`);
            } catch (error) {
                console.error(`Error unregistering global shortcut ${shortcut}:`, error);
            }
        });
        
        this.registeredShortcuts = [];
        
        // Also unregister any remaining shortcuts
        globalShortcut.unregisterAll();
        console.log('🔓 All global shortcuts unregistered');
    }

    isRegistered(accelerator) {
        return this.registeredShortcuts.includes(accelerator);
    }

    getRegisteredShortcuts() {
        return [...this.registeredShortcuts];
    }
}

module.exports = GlobalShortcuts;
