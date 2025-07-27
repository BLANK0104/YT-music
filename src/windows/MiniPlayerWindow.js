/**
 * Mini Player Window Management
 */

const { BrowserWindow } = require('electron');
const path = require('path');
const appState = require('../utils/state');
const { appConstants } = require('../utils/constants');

class MiniPlayerWindowManager {
    constructor() {
        this.window = null;
    }

    create() {
        if (this.window) {
            this.window.focus();
            return this.window;
        }
        
        this.window = new BrowserWindow({
            width: appConstants.MINI_PLAYER_SIZE.width,
            height: appConstants.MINI_PLAYER_SIZE.height,
            alwaysOnTop: true,
            frame: false,
            resizable: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '../../preload.js')
            },
            backgroundColor: '#0f0f0f',
            show: false,
            skipTaskbar: true,
            icon: path.join(__dirname, '../../assets', '512px-Youtube_Music_icon.svg.png')
        });
        
        this.window.loadFile(path.join(__dirname, '../../mini-player.html'));
        
        this.window.once('ready-to-show', () => {
            this.window.show();
            // Update setting to reflect mini player is open
            appState.setSetting('miniPlayer', true);
            console.log('📱 Mini player opened');
        });
        
        this.window.on('closed', () => {
            this.window = null;
            appState.setMiniPlayerWindow(null);
            // Update setting to reflect mini player is closed
            appState.setSetting('miniPlayer', false);
            console.log('📱 Mini player closed');
        });

        appState.setMiniPlayerWindow(this.window);
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

module.exports = MiniPlayerWindowManager;
