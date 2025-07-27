/**
 * System Tray Management
 */

const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const appState = require('../utils/state');
const { appConstants } = require('../utils/constants');

class TrayManager {
    constructor() {
        this.tray = null;
    }

    create() {
        if (this.tray) {
            return this.tray;
        }

        const iconPath = process.platform === 'win32' 
            ? path.join(__dirname, '../../assets', '512px-Youtube_Music_icon.svg.png')
            : path.join(__dirname, '../../assets', '512px-Youtube_Music_icon.svg.png');
        
        this.tray = new Tray(nativeImage.createFromPath(iconPath));
        
        const contextMenu = Menu.buildFromTemplate([
            {
                label: `Show ${appConstants.APP_NAME}`,
                click: () => {
                    const mainWindow = appState.getMainWindow();
                    if (mainWindow) {
                        mainWindow.show();
                        mainWindow.focus();
                    }
                }
            },
            {
                label: 'Play/Pause',
                click: async () => {
                    const mainWindow = appState.getMainWindow();
                    if (mainWindow) {
                        await mainWindow.webContents.executeJavaScript(`
                            const playPauseBtn = document.querySelector('${appConstants.SELECTORS.PLAY_PAUSE}');
                            if (playPauseBtn) playPauseBtn.click();
                        `);
                    }
                }
            },
            {
                label: 'Next Track',
                click: async () => {
                    const mainWindow = appState.getMainWindow();
                    if (mainWindow) {
                        await mainWindow.webContents.executeJavaScript(`
                            const nextBtn = document.querySelector('${appConstants.SELECTORS.NEXT}');
                            if (nextBtn) nextBtn.click();
                        `);
                    }
                }
            },
            {
                label: 'Previous Track',
                click: async () => {
                    const mainWindow = appState.getMainWindow();
                    if (mainWindow) {
                        await mainWindow.webContents.executeJavaScript(`
                            const prevBtn = document.querySelector('${appConstants.SELECTORS.PREVIOUS}');
                            if (prevBtn) prevBtn.click();
                        `);
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Mini Player',
                click: () => {
                    const MiniPlayerWindow = require('../windows/MiniPlayerWindow');
                    const miniPlayer = new MiniPlayerWindow();
                    miniPlayer.create();
                }
            },
            {
                label: 'Settings',
                click: () => {
                    const SettingsWindow = require('../windows/SettingsWindow');
                    const settingsWindow = new SettingsWindow();
                    settingsWindow.create();
                }
            },
            { type: 'separator' },
            {
                label: 'Show/Hide',
                click: () => {
                    const mainWindow = appState.getMainWindow();
                    if (mainWindow) {
                        if (mainWindow.isVisible()) {
                            mainWindow.hide();
                        } else {
                            mainWindow.show();
                            mainWindow.focus();
                        }
                    }
                }
            },
            {
                label: 'Quit',
                click: () => {
                    const { app } = require('electron');
                    appState.setQuiting(true);
                    app.quit();
                }
            }
        ]);
        
        this.tray.setContextMenu(contextMenu);
        this.tray.setToolTip(`${appConstants.APP_NAME}`);
        
        // Double-click to show/hide window
        this.tray.on('double-click', () => {
            const mainWindow = appState.getMainWindow();
            if (mainWindow) {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        });

        // Click to show/hide window
        this.tray.on('click', () => {
            const mainWindow = appState.getMainWindow();
            if (mainWindow) {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        });

        appState.setTray(this.tray);
        console.log('🔔 System tray created');
        
        return this.tray;
    }

    destroy() {
        if (this.tray) {
            this.tray.destroy();
            this.tray = null;
            appState.setTray(null);
            console.log('🔔 System tray destroyed');
        }
    }

    getTray() {
        return this.tray;
    }
}

module.exports = TrayManager;
