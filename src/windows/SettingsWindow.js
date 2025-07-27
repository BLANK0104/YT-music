/**
 * Settings Window Management
 */

const { BrowserWindow } = require('electron');
const path = require('path');
const appState = require('../utils/state');
const { appConstants } = require('../utils/constants');

class SettingsWindowManager {
    constructor() {
        this.window = null;
    }

    create() {
        if (this.window) {
            this.window.focus();
            return this.window;
        }
        
        const mainWindow = appState.getMainWindow();
        
        this.window = new BrowserWindow({
            width: appConstants.SETTINGS_WINDOW_SIZE.width,
            height: appConstants.SETTINGS_WINDOW_SIZE.height,
            parent: mainWindow,
            modal: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '../../preload.js')
            },
            titleBarStyle: 'default',
            backgroundColor: '#0f0f0f',
            show: false,
            icon: path.join(__dirname, '../../assets', '512px-Youtube_Music_icon.svg.png')
        });
        
        this.window.loadFile(path.join(__dirname, '../../settings.html'));
        
        this.window.once('ready-to-show', () => {
            this.window.show();
            console.log('⚙️ Settings window opened');
        });
        
        this.window.on('closed', () => {
            this.window = null;
            appState.setSettingsWindow(null);
            console.log('⚙️ Settings window closed');
        });

        appState.setSettingsWindow(this.window);
        return this.window;
    }

    close() {
        if (this.window) {
            this.window.close();
        }
    }

    focus() {
        if (this.window) {
            this.window.focus();
        }
    }

    getWindow() {
        return this.window;
    }
}

module.exports = SettingsWindowManager;
