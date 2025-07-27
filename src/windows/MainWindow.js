/**
 * Main Window Management
 */

const { BrowserWindow, shell, powerSaveBlocker, Notification } = require('electron');
const path = require('path');
const appState = require('../utils/state');
const { appConstants } = require('../utils/constants');

class MainWindowManager {
    constructor() {
        this.window = null;
    }

    create() {
        const windowBounds = appState.getWindowBounds();
        const settings = appState.getSettings();
        
        // Create the browser window
        this.window = new BrowserWindow({
            ...windowBounds,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, '../../preload.js'),
                webSecurity: true,
                backgroundThrottling: false // Keep playing when minimized
            },
            titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
            icon: path.join(__dirname, '../../assets', '512px-Youtube_Music_icon.svg.png'),
            show: false,
            backgroundColor: '#00000000', // Transparent background for glass effect
            transparent: true, // Enable transparency
            vibrancy: process.platform === 'darwin' ? 'ultra-dark' : undefined,
            visualEffectState: 'active',
            frame: process.platform === 'win32' ? false : true // Frameless on Windows for better glass effect
        });

        // Enable hardware acceleration and performance optimizations
        this.setupPerformanceOptimizations();

        // Initialize background playback if enabled
        if (settings.backgroundPlay) {
            const powerSaveId = powerSaveBlocker.start('prevent-app-suspension');
            appState.setPowerSaveId(powerSaveId);
            console.log('🔋 Background playback enabled');
        }

        // Load YouTube Music
        this.window.loadURL(appConstants.YOUTUBE_MUSIC_URL);

        // Setup event handlers
        this.setupEventHandlers();

        // Store window reference
        appState.setMainWindow(this.window);

        return this.window;
    }

    setupPerformanceOptimizations() {
        const { app } = require('electron');
        app.commandLine.appendSwitch('enable-gpu-rasterization');
        app.commandLine.appendSwitch('enable-zero-copy');
        app.commandLine.appendSwitch('disable-background-timer-throttling');
        app.commandLine.appendSwitch('disable-renderer-backgrounding');
        app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');
    }

    setupEventHandlers() {
        // Handle external links
        this.window.webContents.setWindowOpenHandler(({ url }) => {
            if (url.startsWith(appConstants.YOUTUBE_MUSIC_URL)) {
                return { action: 'allow' };
            } else {
                shell.openExternal(url);
                return { action: 'deny' };
            }
        });

        // Save window bounds on resize/move
        const saveBounds = () => {
            appState.setWindowBounds(this.window.getBounds());
        };

        this.window.on('resize', saveBounds);
        this.window.on('move', saveBounds);

        // Handle window close attempt (before closing)
        this.window.on('close', (event) => {
            const settings = appState.getSettings();
            
            // If not quitting via menu/quit command and system tray is enabled
            if (!appState.isAppQuiting() && settings.systemTray) {
                event.preventDefault();
                this.window.hide();
                
                // Show notification on first minimize to tray
                if (settings.desktopNotifications && !appState.getTrayNotificationShown()) {
                    new Notification({
                        title: appConstants.APP_NAME,
                        body: 'App minimized to system tray. Click the tray icon to restore.',
                        icon: path.join(__dirname, '../../assets', '512px-Youtube_Music_icon.svg.png')
                    }).show();
                    appState.setTrayNotificationShown(true);
                }
                
                console.log('🔄 App minimized to system tray');
                return false;
            }
            
            // Otherwise allow normal close
            console.log('❌ App closing normally');
        });

        // Handle window closed
        this.window.on('closed', () => {
            this.window = null;
            appState.setMainWindow(null);
        });

        // Prevent navigation away from YouTube Music
        this.window.webContents.on('will-navigate', (event, navigationUrl) => {
            const parsedUrl = new URL(navigationUrl);
            if (parsedUrl.hostname !== 'music.youtube.com' && parsedUrl.hostname !== 'accounts.google.com') {
                event.preventDefault();
                shell.openExternal(navigationUrl);
            }
        });
    }

    show() {
        if (this.window) {
            this.window.show();
            console.log('🎵 YouTube Music Desktop App loaded successfully');
        }
    }

    hide() {
        if (this.window) {
            this.window.hide();
        }
    }

    focus() {
        if (this.window) {
            this.window.focus();
        }
    }

    minimize() {
        if (this.window) {
            this.window.minimize();
        }
    }

    maximize() {
        if (this.window) {
            if (this.window.isMaximized()) {
                this.window.unmaximize();
            } else {
                this.window.maximize();
            }
        }
    }

    close() {
        if (this.window) {
            this.window.close();
        }
    }

    isVisible() {
        return this.window ? this.window.isVisible() : false;
    }

    setAlwaysOnTop(flag) {
        if (this.window) {
            this.window.setAlwaysOnTop(flag);
        }
    }

    setFullScreen(flag) {
        if (this.window) {
            this.window.setFullScreen(flag);
        }
    }

    isFullScreen() {
        return this.window ? this.window.isFullScreen() : false;
    }

    setZoomLevel(level) {
        if (this.window) {
            this.window.webContents.setZoomLevel(level);
        }
    }

    getZoomLevel() {
        return this.window ? this.window.webContents.getZoomLevel() : 0;
    }

    executeJavaScript(code) {
        if (this.window) {
            return this.window.webContents.executeJavaScript(code);
        }
        return Promise.resolve(false);
    }

    getWindow() {
        return this.window;
    }
}

module.exports = MainWindowManager;
