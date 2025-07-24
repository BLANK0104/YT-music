const { app, BrowserWindow, session, Menu, shell, Tray, nativeImage, ipcMain, globalShortcut, powerSaveBlocker, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');

let mainWindow;
let settingsWindow;
let miniPlayerWindow;
let tray = null;
let isQuiting = false;
let powerSaveId = null;
let currentTrack = {};
const store = new Store();

// Default settings with all new features
const defaultSettings = {
    // Playback Features
    backgroundPlay: true,
    autoPauseOnInterruption: true,
    crossfade: false,
    gaplessPlayback: true,
    
    // System Integration
    startWithWindows: false,
    systemTray: true,
    mediaKeys: true,
    discordRichPresence: false,
    
    // Audio Enhancement
    equalizerEnabled: false,
    audioNormalization: true,
    bassBoost: 0,
    
    // Equalizer bands
    eq60: 0, eq170: 0, eq310: 0, eq600: 0, eq1k: 0,
    eq3k: 0, eq6k: 0, eq12k: 0, eq14k: 0, eq16k: 0,
    
    // Visual & Interface
    customThemes: false,
    animatedBackground: true,
    visualizer: false,
    miniPlayer: false,
    
    // Notifications & Feedback
    desktopNotifications: true,
    lastfmScrobbling: false,
    hapticFeedback: false
};

function createWindow() {
    // Get stored window bounds or use defaults
    const windowBounds = store.get('windowBounds', { width: 1400, height: 900 });
    const settings = { ...defaultSettings, ...store.get('settings', {}) };
    
    // Create the browser window
    mainWindow = new BrowserWindow({
        ...windowBounds,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true
        },
        titleBarStyle: 'default',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        show: false,
        backgroundColor: '#0f0f0f',
        vibrancy: 'ultra-dark', // macOS glass effect
        visualEffectState: 'active'
    });

    // Enable hardware acceleration and performance optimizations
    app.commandLine.appendSwitch('enable-gpu-rasterization');
    app.commandLine.appendSwitch('enable-zero-copy');
    app.commandLine.appendSwitch('disable-background-timer-throttling');
    app.commandLine.appendSwitch('disable-renderer-backgrounding');
    app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');

    // Initialize background playback if enabled
    if (settings.backgroundPlay) {
        powerSaveId = powerSaveBlocker.start('prevent-app-suspension');
        console.log('🔋 Background playback enabled');
    }

    // Load YouTube Music
    mainWindow.loadURL('https://music.youtube.com');

    // Show window when ready with fade-in animation
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        console.log('🎵 YouTube Music Desktop App loaded successfully');
        
        // Setup custom menu bar
        createCustomMenu();
        
        // Setup system tray if enabled
        if (settings.systemTray) {
            createSystemTray();
        }
        
        // Setup global media keys if enabled
        if (settings.mediaKeys) {
            setupGlobalShortcuts();
        }
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://music.youtube.com')) {
            return { action: 'allow' };
        } else {
            shell.openExternal(url);
            return { action: 'deny' };
        }
    });

    // Save window bounds on resize/move
    const saveBounds = () => {
        store.set('windowBounds', mainWindow.getBounds());
    };

    mainWindow.on('resize', saveBounds);
    mainWindow.on('move', saveBounds);

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Prevent navigation away from YouTube Music
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        if (parsedUrl.hostname !== 'music.youtube.com' && parsedUrl.hostname !== 'accounts.google.com') {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        }
    });

    // Create system tray
    createTray();

    // Set up global shortcuts for media controls
    setupGlobalShortcuts();
}

// Enhanced System Tray with new features
function createSystemTray() {
    if (!tray) {
        const iconPath = process.platform === 'win32' 
            ? path.join(__dirname, 'assets', 'icon.ico')
            : path.join(__dirname, 'assets', 'icon.png');
        
        tray = new Tray(nativeImage.createFromPath(iconPath));
        
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Play/Pause',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.executeJavaScript('window.ytMusic?.play() || window.ytMusic?.pause()');
                    }
                }
            },
            {
                label: 'Next Track',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.executeJavaScript('window.ytMusic?.next()');
                    }
                }
            },
            {
                label: 'Previous Track',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.executeJavaScript('window.ytMusic?.previous()');
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Mini Player',
                click: () => createMiniPlayer()
            },
            {
                label: 'Settings',
                click: () => createSettingsWindow()
            },
            { type: 'separator' },
            {
                label: 'Show/Hide',
                click: () => {
                    if (mainWindow.isVisible()) {
                        mainWindow.hide();
                    } else {
                        mainWindow.show();
                        mainWindow.focus();
                    }
                }
            },
            {
                label: 'Quit',
                click: () => {
                    isQuiting = true;
                    app.quit();
                }
            }
        ]);
        
        tray.setContextMenu(contextMenu);
        tray.setToolTip('YouTube Music Desktop');
        
        // Double-click to show/hide window
        tray.on('double-click', () => {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        });
    }
}

// Custom Menu Bar with YouTube Music Features
function createCustomMenu() {
    const template = [
        {
            label: 'YouTube Music',
            submenu: [
                {
                    label: 'About YouTube Music Desktop',
                    click: () => {
                        // Show about dialog
                        const aboutWindow = new BrowserWindow({
                            width: 400,
                            height: 300,
                            parent: mainWindow,
                            modal: true,
                            webPreferences: { nodeIntegration: true },
                            titleBarStyle: 'default',
                            show: false
                        });
                        aboutWindow.loadURL(`data:text/html,
                            <html>
                                <head><title>About</title></head>
                                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; padding: 40px; text-align: center; background: #0f0f0f; color: white;">
                                    <h2>YouTube Music Desktop</h2>
                                    <p>Version 1.0.0</p>
                                    <p>Enhanced desktop experience for YouTube Music with advanced features</p>
                                    <br>
                                    <p><strong>Features:</strong></p>
                                    <p>• Background Playback</p>
                                    <p>• Global Media Keys</p>
                                    <p>• System Tray Integration</p>
                                    <p>• Desktop Notifications</p>
                                    <p>• Mini Player</p>
                                    <p>• Audio Enhancements</p>
                                </body>
                            </html>
                        `);
                        aboutWindow.once('ready-to-show', () => aboutWindow.show());
                    }
                },
                { type: 'separator' },
                {
                    label: 'Settings',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => createSettingsWindow()
                },
                { type: 'separator' },
                {
                    label: 'Hide YouTube Music',
                    accelerator: process.platform === 'darwin' ? 'Cmd+H' : 'Ctrl+H',
                    click: () => mainWindow.hide()
                },
                {
                    label: 'Quit YouTube Music',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        isQuiting = true;
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Playback',
            submenu: [
                {
                    label: 'Play/Pause',
                    accelerator: 'Space',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript('window.ytMusic?.play() || window.ytMusic?.pause()');
                        }
                    }
                },
                {
                    label: 'Next Track',
                    accelerator: 'CmdOrCtrl+Right',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript('window.ytMusic?.next()');
                        }
                    }
                },
                {
                    label: 'Previous Track',
                    accelerator: 'CmdOrCtrl+Left',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript('window.ytMusic?.previous()');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Shuffle',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript('window.ytMusic?.toggleShuffle()');
                        }
                    }
                },
                {
                    label: 'Repeat',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript('window.ytMusic?.toggleRepeat()');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Volume Up',
                    accelerator: 'CmdOrCtrl+Up',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript(`
                                const currentVolume = window.ytMusic?.getVolume() || 50;
                                window.ytMusic?.setVolume(Math.min(100, currentVolume + 10));
                            `);
                        }
                    }
                },
                {
                    label: 'Volume Down',
                    accelerator: 'CmdOrCtrl+Down',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript(`
                                const currentVolume = window.ytMusic?.getVolume() || 50;
                                window.ytMusic?.setVolume(Math.max(0, currentVolume - 10));
                            `);
                        }
                    }
                }
            ]
        },
        {
            label: 'Navigation',
            submenu: [
                {
                    label: 'Home',
                    accelerator: 'CmdOrCtrl+1',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript('window.ytMusic?.navigateToHome()');
                        }
                    }
                },
                {
                    label: 'Explore',
                    accelerator: 'CmdOrCtrl+2',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript('window.ytMusic?.navigateToExplore()');
                        }
                    }
                },
                {
                    label: 'Library',
                    accelerator: 'CmdOrCtrl+3',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript('window.ytMusic?.navigateToLibrary()');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Search',
                    accelerator: 'CmdOrCtrl+F',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript(`
                                const searchBox = document.querySelector('ytmusic-search-box input, #search-input, [placeholder*="Search"]');
                                if (searchBox) {
                                    searchBox.focus();
                                }
                            `);
                        }
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Mini Player',
                    accelerator: 'CmdOrCtrl+M',
                    click: () => createMiniPlayer()
                },
                {
                    label: 'Always on Top',
                    type: 'checkbox',
                    click: (menuItem) => {
                        if (mainWindow) {
                            mainWindow.setAlwaysOnTop(menuItem.checked);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Actual Size',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.setZoomLevel(0);
                        }
                    }
                },
                {
                    label: 'Zoom In',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        if (mainWindow) {
                            const currentZoom = mainWindow.webContents.getZoomLevel();
                            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
                        }
                    }
                },
                {
                    label: 'Zoom Out',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => {
                        if (mainWindow) {
                            const currentZoom = mainWindow.webContents.getZoomLevel();
                            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Full Screen',
                    accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.setFullScreen(!mainWindow.isFullScreen());
                        }
                    }
                }
            ]
        },
        {
            label: 'Features',
            submenu: [
                {
                    label: 'Background Playback',
                    type: 'checkbox',
                    checked: store.get('settings.backgroundPlay', defaultSettings.backgroundPlay),
                    click: (menuItem) => {
                        const settings = store.get('settings', defaultSettings);
                        settings.backgroundPlay = menuItem.checked;
                        store.set('settings', settings);
                        applySettingChange('backgroundPlay', menuItem.checked);
                    }
                },
                {
                    label: 'Desktop Notifications',
                    type: 'checkbox',
                    checked: store.get('settings.desktopNotifications', defaultSettings.desktopNotifications),
                    click: (menuItem) => {
                        const settings = store.get('settings', defaultSettings);
                        settings.desktopNotifications = menuItem.checked;
                        store.set('settings', settings);
                    }
                },
                {
                    label: 'System Tray',
                    type: 'checkbox',
                    checked: store.get('settings.systemTray', defaultSettings.systemTray),
                    click: (menuItem) => {
                        const settings = store.get('settings', defaultSettings);
                        settings.systemTray = menuItem.checked;
                        store.set('settings', settings);
                        applySettingChange('systemTray', menuItem.checked);
                    }
                },
                {
                    label: 'Media Keys',
                    type: 'checkbox',
                    checked: store.get('settings.mediaKeys', defaultSettings.mediaKeys),
                    click: (menuItem) => {
                        const settings = store.get('settings', defaultSettings);
                        settings.mediaKeys = menuItem.checked;
                        store.set('settings', settings);
                        applySettingChange('mediaKeys', menuItem.checked);
                    }
                },
                { type: 'separator' },
                {
                    label: 'Audio Normalization',
                    type: 'checkbox',
                    checked: store.get('settings.audioNormalization', defaultSettings.audioNormalization),
                    click: (menuItem) => {
                        const settings = store.get('settings', defaultSettings);
                        settings.audioNormalization = menuItem.checked;
                        store.set('settings', settings);
                    }
                },
                {
                    label: 'Equalizer',
                    type: 'checkbox',
                    checked: store.get('settings.equalizerEnabled', defaultSettings.equalizerEnabled),
                    click: (menuItem) => {
                        const settings = store.get('settings', defaultSettings);
                        settings.equalizerEnabled = menuItem.checked;
                        store.set('settings', settings);
                    }
                }
            ]
        },
        {
            label: 'Window',
            submenu: [
                {
                    label: 'Minimize',
                    accelerator: 'CmdOrCtrl+M',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.minimize();
                        }
                    }
                },
                {
                    label: 'Close',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.close();
                        }
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Keyboard Shortcuts',
                    click: () => {
                        // Show shortcuts dialog
                        const shortcutsWindow = new BrowserWindow({
                            width: 500,
                            height: 600,
                            parent: mainWindow,
                            modal: true,
                            webPreferences: { nodeIntegration: true },
                            titleBarStyle: 'default',
                            show: false
                        });
                        shortcutsWindow.loadURL(`data:text/html,
                            <html>
                                <head><title>Keyboard Shortcuts</title></head>
                                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; padding: 30px; background: #0f0f0f; color: white;">
                                    <h2>Keyboard Shortcuts</h2>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                        <div>
                                            <h3>Playback</h3>
                                            <p><kbd>Space</kbd> Play/Pause</p>
                                            <p><kbd>Ctrl+→</kbd> Next Track</p>
                                            <p><kbd>Ctrl+←</kbd> Previous Track</p>
                                            <p><kbd>Ctrl+↑</kbd> Volume Up</p>
                                            <p><kbd>Ctrl+↓</kbd> Volume Down</p>
                                            
                                            <h3>Navigation</h3>
                                            <p><kbd>Ctrl+1</kbd> Home</p>
                                            <p><kbd>Ctrl+2</kbd> Explore</p>
                                            <p><kbd>Ctrl+3</kbd> Library</p>
                                            <p><kbd>Ctrl+F</kbd> Search</p>
                                        </div>
                                        <div>
                                            <h3>Application</h3>
                                            <p><kbd>Ctrl+,</kbd> Settings</p>
                                            <p><kbd>Ctrl+M</kbd> Mini Player</p>
                                            <p><kbd>F11</kbd> Full Screen</p>
                                            <p><kbd>Ctrl+Q</kbd> Quit</p>
                                            
                                            <h3>Global Shortcuts</h3>
                                            <p><kbd>Media Play/Pause</kbd> Play/Pause</p>
                                            <p><kbd>Media Next</kbd> Next Track</p>
                                            <p><kbd>Media Previous</kbd> Previous Track</p>
                                        </div>
                                    </div>
                                    <style>
                                        kbd { background: #333; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
                                        h3 { color: #4ecdc4; margin-top: 20px; }
                                        p { margin: 8px 0; }
                                    </style>
                                </body>
                            </html>
                        `);
                        shortcutsWindow.once('ready-to-show', () => shortcutsWindow.show());
                    }
                },
                { type: 'separator' },
                {
                    label: 'GitHub Repository',
                    click: () => {
                        shell.openExternal('https://github.com/BLANK0104/YT-music');
                    }
                }
            ]
        }
    ];

    // Set the custom menu
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    
    console.log('📋 Custom menu bar created with YouTube Music features');
}

// Enhanced Global Shortcuts
function setupGlobalShortcuts() {
    // Media control shortcuts
    globalShortcut.register('MediaPlayPause', () => {
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript('window.ytMusic?.play() || window.ytMusic?.pause()');
        }
    });
    
    globalShortcut.register('MediaNextTrack', () => {
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript('window.ytMusic?.next()');
        }
    });
    
    globalShortcut.register('MediaPreviousTrack', () => {
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript('window.ytMusic?.previous()');
        }
    });
    
    // Custom shortcuts
    globalShortcut.register('CommandOrControl+Shift+Space', () => {
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript('window.ytMusic?.play() || window.ytMusic?.pause()');
        }
    });
    
    globalShortcut.register('CommandOrControl+Shift+Right', () => {
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript('window.ytMusic?.next()');
        }
    });
    
    globalShortcut.register('CommandOrControl+Shift+Left', () => {
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript('window.ytMusic?.previous()');
        }
    });
    
    // Settings shortcut
    globalShortcut.register('CommandOrControl+,', () => {
        createSettingsWindow();
    });
    
    console.log('🎹 Global media shortcuts enabled');
}

// Settings Window
function createSettingsWindow() {
    if (settingsWindow) {
        settingsWindow.focus();
        return;
    }
    
    settingsWindow = new BrowserWindow({
        width: 900,
        height: 700,
        parent: mainWindow,
        modal: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'default',
        backgroundColor: '#0f0f0f',
        show: false
    });
    
    settingsWindow.loadFile('settings.html');
    
    settingsWindow.once('ready-to-show', () => {
        settingsWindow.show();
    });
    
    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
}

// Mini Player Window
function createMiniPlayer() {
    if (miniPlayerWindow) {
        miniPlayerWindow.focus();
        return;
    }
    
    miniPlayerWindow = new BrowserWindow({
        width: 400,
        height: 150,
        alwaysOnTop: true,
        frame: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        backgroundColor: '#0f0f0f',
        show: false,
        skipTaskbar: true
    });
    
    miniPlayerWindow.loadFile('mini-player.html');
    
    miniPlayerWindow.once('ready-to-show', () => {
        miniPlayerWindow.show();
    });
    
    miniPlayerWindow.on('closed', () => {
        miniPlayerWindow = null;
    });
}

// Desktop Notifications
function showNotification(track) {
    const settings = store.get('settings', defaultSettings);
    
    if (settings.desktopNotifications && track.title) {
        new Notification({
            title: track.title,
            body: `${track.artist || 'Unknown Artist'}${track.album ? ` - ${track.album}` : ''}`,
            icon: track.thumbnail || path.join(__dirname, 'assets', 'icon.png'),
            silent: false
        }).show();
    }
}

// Auto-startup management
function setupAutoStart() {
    const settings = store.get('settings', defaultSettings);
    
    app.setLoginItemSettings({
        openAtLogin: settings.startWithWindows,
        path: process.execPath,
        args: ['--hidden']
    });
}

function createTray() {
    const iconPath = process.platform === 'win32' 
        ? path.join(__dirname, 'assets', 'icon.ico')
        : path.join(__dirname, 'assets', 'icon.png');
    
    tray = new Tray(nativeImage.createFromPath(iconPath));
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show YouTube Music',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: 'Play/Pause',
            click: async () => {
                if (mainWindow) {
                    await mainWindow.webContents.executeJavaScript(`
                        const playPauseBtn = document.querySelector('#play-pause-button');
                        if (playPauseBtn) playPauseBtn.click();
                    `);
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuiting = true;
                app.quit();
            }
        }
    ]);
    
    tray.setContextMenu(contextMenu);
    tray.setToolTip('YouTube Music Desktop');
    
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });
}

function setupGlobalShortcuts() {
    // Media controls
    globalShortcut.register('MediaPlayPause', async () => {
        if (mainWindow) {
            await mainWindow.webContents.executeJavaScript(`
                const playPauseBtn = document.querySelector('#play-pause-button');
                if (playPauseBtn) playPauseBtn.click();
            `);
        }
    });

    globalShortcut.register('MediaNextTrack', async () => {
        if (mainWindow) {
            await mainWindow.webContents.executeJavaScript(`
                const nextBtn = document.querySelector('.next-button.ytmusic-player-bar');
                if (nextBtn) nextBtn.click();
            `);
        }
    });

    globalShortcut.register('MediaPreviousTrack', async () => {
        if (mainWindow) {
            await mainWindow.webContents.executeJavaScript(`
                const prevBtn = document.querySelector('.previous-button.ytmusic-player-bar');
                if (prevBtn) prevBtn.click();
            `);
        }
    });
}

// App event handlers
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    isQuiting = true;
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// IPC handlers for media controls
ipcMain.handle('media-play-pause', async () => {
    if (mainWindow) {
        return await mainWindow.webContents.executeJavaScript(`
            const playPauseBtn = document.querySelector('#play-pause-button');
            if (playPauseBtn) {
                playPauseBtn.click();
                return true;
            }
            return false;
        `);
    }
});

ipcMain.handle('media-next', async () => {
    if (mainWindow) {
        return await mainWindow.webContents.executeJavaScript(`
            const nextBtn = document.querySelector('.next-button.ytmusic-player-bar');
            if (nextBtn) {
                nextBtn.click();
                return true;
            }
            return false;
        `);
    }
});

ipcMain.handle('media-previous', async () => {
    if (mainWindow) {
        return await mainWindow.webContents.executeJavaScript(`
            const prevBtn = document.querySelector('.previous-button.ytmusic-player-bar');
            if (prevBtn) {
                prevBtn.click();
                return true;
            }
            return false;
        `);
    }
});

// Window controls
ipcMain.handle('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.handle('window-close', () => {
    if (mainWindow) mainWindow.close();
});

// Navigation
ipcMain.handle('navigate-home', async () => {
    if (mainWindow) {
        return await mainWindow.webContents.executeJavaScript(`
            const homeBtn = document.querySelector('a[href="/"]');
            if (homeBtn) {
                homeBtn.click();
                return true;
            }
            return false;
        `);
    }
});

ipcMain.handle('navigate-library', async () => {
    if (mainWindow) {
        return await mainWindow.webContents.executeJavaScript(`
            const libraryBtn = document.querySelector('a[href*="library"]');
            if (libraryBtn) {
                libraryBtn.click();
                return true;
            }
            return false;
        `);
    }
});

// Enhanced Settings Management
ipcMain.handle('get-setting', (event, key, defaultValue) => {
    const settings = store.get('settings', defaultSettings);
    return settings[key] ?? defaultValue;
});

ipcMain.handle('set-setting', (event, key, value) => {
    const settings = store.get('settings', defaultSettings);
    settings[key] = value;
    store.set('settings', settings);
    
    // Apply setting changes immediately
    applySettingChange(key, value);
});

ipcMain.handle('get-all-settings', () => {
    return store.get('settings', defaultSettings);
});

ipcMain.handle('save-settings', (event, newSettings) => {
    const currentSettings = store.get('settings', defaultSettings);
    const mergedSettings = { ...currentSettings, ...newSettings };
    store.set('settings', mergedSettings);
    
    // Apply all setting changes
    Object.keys(newSettings).forEach(key => {
        applySettingChange(key, newSettings[key]);
    });
    
    return true;
});

// Feature Controls
ipcMain.handle('open-settings', () => {
    createSettingsWindow();
});

ipcMain.handle('open-mini-player', () => {
    createMiniPlayer();
});

ipcMain.handle('toggle-background-play', (event, enabled) => {
    if (enabled) {
        if (!powerSaveId) {
            powerSaveId = powerSaveBlocker.start('prevent-app-suspension');
        }
    } else {
        if (powerSaveId) {
            powerSaveBlocker.stop(powerSaveId);
            powerSaveId = null;
        }
    }
});

ipcMain.handle('show-notification', (event, track) => {
    showNotification(track);
});

ipcMain.handle('get-current-track', () => {
    return currentTrack;
});

ipcMain.handle('set-current-track', (event, track) => {
    currentTrack = track;
    
    // Update tray tooltip with current track
    if (tray && track.title) {
        tray.setToolTip(`YouTube Music - ${track.title} by ${track.artist || 'Unknown Artist'}`);
    }
    
    // Show notification if enabled
    showNotification(track);
});

// Theme
ipcMain.handle('get-theme', () => {
    return store.get('theme', 'dark');
});

ipcMain.handle('set-theme', (event, theme) => {
    store.set('theme', theme);
});

// Apply setting changes immediately
function applySettingChange(key, value) {
    switch (key) {
        case 'backgroundPlay':
            if (value) {
                if (!powerSaveId) {
                    powerSaveId = powerSaveBlocker.start('prevent-app-suspension');
                    console.log('🔋 Background playback enabled');
                }
            } else {
                if (powerSaveId) {
                    powerSaveBlocker.stop(powerSaveId);
                    powerSaveId = null;
                    console.log('🔋 Background playback disabled');
                }
            }
            break;
            
        case 'startWithWindows':
            setupAutoStart();
            break;
            
        case 'systemTray':
            if (value && !tray) {
                createSystemTray();
            } else if (!value && tray) {
                tray.destroy();
                tray = null;
            }
            break;
            
        case 'mediaKeys':
            if (value) {
                setupGlobalShortcuts();
            } else {
                globalShortcut.unregisterAll();
            }
            break;
    }
}
