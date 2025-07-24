const { app, BrowserWindow, session, Menu, shell, Tray, nativeImage, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const Store = require('electron-store');

let mainWindow;
let tray = null;
let isQuiting = false;
const store = new Store();

// Ad blocking rules - common ad domains and selectors
const adBlockingRules = [
    '*://*.doubleclick.net/*',
    '*://*.googlesyndication.com/*',
    '*://*.googleadservices.com/*',
    '*://*.google-analytics.com/*',
    '*://*.googletagmanager.com/*',
    '*://*.youtube.com/api/stats/ads*',
    '*://*.youtube.com/pagead/*',
    '*://*.youtube.com/ptracking*'
];

// Enhanced CSS with glass effects, animations, and ad blocking
const enhancedCSS = `
    /* YouTube Music ad blocking CSS */
    .ytmusic-popup-container,
    .advertisement-shelf-renderer,
    .masthead-ad-control,
    .video-ads,
    .ytp-ad-module,
    .ytp-ad-overlay-container,
    .ytp-ad-text-overlay,
    .ytp-ad-player-overlay,
    ytmusic-premium-upsell-banner,
    .ytmusic-premium-upsell-banner,
    [class*="premium-upsell"],
    [class*="advertisement"],
    [id*="google_ads"],
    [class*="google_ads"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
    }
    
    /* Remove premium upgrade prompts */
    ytmusic-menu-popup-renderer[menu-style="MENU_STYLE_COMPACT"] {
        display: none !important;
    }
    
    /* Hide interruption overlays */
    .ytmusic-you-there-renderer,
    .ytmusic-interruption-modal {
        display: none !important;
    }

    /* Glass morphism effects */
    ytmusic-nav-bar,
    .ytmusic-nav-bar {
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        background: rgba(0, 0, 0, 0.8) !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
    }

    ytmusic-player-bar,
    .ytmusic-player-bar {
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        background: rgba(0, 0, 0, 0.8) !important;
        border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
    }

    ytmusic-side-panel,
    .ytmusic-side-panel {
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        background: rgba(0, 0, 0, 0.7) !important;
    }

    /* Smooth animations */
    * {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    /* Custom scrollbar */
    ::-webkit-scrollbar {
        width: 8px;
    }

    ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
    }

    /* Enhanced hover effects */
    ytmusic-two-row-item-renderer:hover,
    ytmusic-responsive-list-item-renderer:hover,
    .ytmusic-menu-renderer:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
        background: rgba(255, 255, 255, 0.1) !important;
    }

    /* Glowing play button */
    #play-pause-button:hover {
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.5) !important;
        transform: scale(1.1) !important;
    }

    /* Animated progress bar */
    .progress-bar {
        background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffa726) !important;
        background-size: 500% 500% !important;
        animation: gradientShift 3s ease infinite !important;
    }

    @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    /* Fade-in animation for content */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    ytmusic-section-list-renderer > *,
    ytmusic-shelf-renderer > * {
        animation: fadeIn 0.6s ease-out !important;
    }

    /* Custom title bar */
    .custom-titlebar {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 40px !important;
        background: rgba(0, 0, 0, 0.9) !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 9999 !important;
        -webkit-app-region: drag !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
    }

    .custom-titlebar-text {
        color: white !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        font-family: 'Roboto', sans-serif !important;
    }

    /* Adjust main content for title bar */
    ytmusic-app {
        margin-top: 40px !important;
    }

    /* Volume slider enhancement */
    .volume-slider {
        background: linear-gradient(90deg, #ff6b6b, #4ecdc4) !important;
        border-radius: 10px !important;
    }

    /* Enhanced notification style */
    .ytmusic-notification-action-renderer {
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        background: rgba(0, 0, 0, 0.8) !important;
        border-radius: 12px !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
    }
`;

function createWindow() {
    // Get stored window bounds or use defaults
    const windowBounds = store.get('windowBounds', { width: 1400, height: 900 });
    
    // Create the browser window
    mainWindow = new BrowserWindow({
        ...windowBounds,
        minWidth: 1000,
        minHeight: 700,
        icon: path.join(__dirname, 'assets', '512px-Youtube_Music_icon.svg.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: false,
            backgroundThrottling: false // Keep audio playing in background
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#1a1a1a',
            symbolColor: '#ffffff',
            height: 40
        },
        frame: false,
        show: false,
        backgroundColor: '#0f0f0f',
        vibrancy: 'ultra-dark', // macOS glass effect
        visualEffectState: 'active'
    });

    // Setup ad blocking
    setupAdBlocking();

    // Enable hardware acceleration
    app.commandLine.appendSwitch('enable-gpu-rasterization');
    app.commandLine.appendSwitch('enable-zero-copy');
    app.commandLine.appendSwitch('disable-background-timer-throttling');
    app.commandLine.appendSwitch('disable-renderer-backgrounding');

    // Load YouTube Music
    mainWindow.loadURL('https://music.youtube.com');

    // Show window when ready with fade-in animation
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Inject enhanced CSS with glass effects and animations
        mainWindow.webContents.insertCSS(enhancedCSS);
        
        // Register global shortcuts
        registerGlobalShortcuts();
    });

    // Save window bounds on resize/move
    mainWindow.on('resize', () => saveWindowBounds());
    mainWindow.on('move', () => saveWindowBounds());

    // Handle minimize to tray
    mainWindow.on('minimize', (event) => {
        if (store.get('minimizeToTray', true)) {
            event.preventDefault();
            mainWindow.hide();
            if (process.platform === 'darwin') {
                app.dock.hide();
            }
        }
    });

    // Handle close to tray
    mainWindow.on('close', (event) => {
        if (!isQuiting) {
            event.preventDefault();
            mainWindow.hide();
            if (process.platform === 'darwin') {
                app.dock.hide();
            }
        }
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Handle page navigation
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        // Allow navigation within YouTube Music domain
        if (parsedUrl.hostname !== 'music.youtube.com' && 
            parsedUrl.hostname !== 'accounts.google.com' &&
            parsedUrl.hostname !== 'myaccount.google.com') {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        }
    });

    // Re-inject CSS on page loads
    mainWindow.webContents.on('dom-ready', () => {
        mainWindow.webContents.insertCSS(enhancedCSS);
        // Inject custom title bar
        mainWindow.webContents.executeJavaScript(`
            if (!document.querySelector('.custom-titlebar')) {
                const titleBar = document.createElement('div');
                titleBar.className = 'custom-titlebar';
                titleBar.innerHTML = '<div class="custom-titlebar-text">🎵 YouTube Music</div>';
                document.body.appendChild(titleBar);
            }
        `);
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Create application menu and system tray
    createMenu();
    createTray();
}

function createTray() {
    // Create tray icon using the official YouTube Music icon
    const iconPath = path.join(__dirname, 'assets', '512px-Youtube_Music_icon.svg.png');
    const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    
    tray = new Tray(trayIcon);
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show YouTube Music',
            click: () => {
                mainWindow.show();
                if (process.platform === 'darwin') {
                    app.dock.show();
                }
            }
        },
        {
            label: 'Play/Pause',
            click: () => {
                mainWindow.webContents.executeJavaScript(`
                    const playButton = document.querySelector('#play-pause-button');
                    if (playButton) playButton.click();
                `);
            }
        },
        {
            label: 'Next Track',
            click: () => {
                mainWindow.webContents.executeJavaScript(`
                    const nextButton = document.querySelector('.next-button');
                    if (nextButton) nextButton.click();
                `);
            }
        },
        {
            label: 'Previous Track',
            click: () => {
                mainWindow.webContents.executeJavaScript(`
                    const prevButton = document.querySelector('.previous-button');
                    if (prevButton) prevButton.click();
                `);
            }
        },
        { type: 'separator' },
        {
            label: 'Settings',
            click: () => {
                createSettingsWindow();
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
    
    // Double click to show/hide window
    tray.on('double-click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            if (process.platform === 'darwin') {
                app.dock.show();
            }
        }
    });
}

function saveWindowBounds() {
    if (mainWindow) {
        store.set('windowBounds', mainWindow.getBounds());
    }
}

function registerGlobalShortcuts() {
    // Media keys
    globalShortcut.register('MediaPlayPause', () => {
        mainWindow.webContents.executeJavaScript(`
            const playButton = document.querySelector('#play-pause-button');
            if (playButton) playButton.click();
        `);
    });

    globalShortcut.register('MediaNextTrack', () => {
        mainWindow.webContents.executeJavaScript(`
            const nextButton = document.querySelector('.next-button');
            if (nextButton) nextButton.click();
        `);
    });

    globalShortcut.register('MediaPreviousTrack', () => {
        mainWindow.webContents.executeJavaScript(`
            const prevButton = document.querySelector('.previous-button');
            if (prevButton) prevButton.click();
        `);
    });

    // Custom shortcuts
    globalShortcut.register('Alt+M', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });
}

function createSettingsWindow() {
    const settingsWindow = new BrowserWindow({
        width: 600,
        height: 500,
        parent: mainWindow,
        modal: true,
        show: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        backgroundColor: '#1a1a1a',
        vibrancy: 'ultra-dark'
    });

    settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
    settingsWindow.once('ready-to-show', () => {
        settingsWindow.show();
    });
}

function setupAdBlocking() {
    // Block ad requests at network level
    session.defaultSession.webRequest.onBeforeRequest({
        urls: adBlockingRules
    }, (details, callback) => {
        callback({ cancel: true });
    });

    // Additional blocking for YouTube specific ad requests
    session.defaultSession.webRequest.onBeforeRequest({
        urls: ['*://music.youtube.com/*']
    }, (details, callback) => {
        const url = details.url.toLowerCase();
        
        // Block specific ad-related endpoints
        if (url.includes('/api/stats/ads') ||
            url.includes('/pagead/') ||
            url.includes('/ptracking') ||
            url.includes('googleads') ||
            url.includes('doubleclick')) {
            callback({ cancel: true });
        } else {
            callback({});
        }
    });
}

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.reload();
                        }
                    }
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: 'F12',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.toggleDevTools();
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Settings',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => {
                        createSettingsWindow();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        isQuiting = true;
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
                { type: 'separator' },
                { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' }
            ]
        },
        {
            label: 'View',
            submenu: [
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
                    label: 'Toggle Fullscreen',
                    accelerator: 'F11',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.setFullScreen(!mainWindow.isFullScreen());
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
                            mainWindow.loadURL('https://music.youtube.com');
                        }
                    }
                },
                {
                    label: 'Library',
                    accelerator: 'CmdOrCtrl+2',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.loadURL('https://music.youtube.com/library');
                        }
                    }
                },
                {
                    label: 'Explore',
                    accelerator: 'CmdOrCtrl+3',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.loadURL('https://music.youtube.com/explore');
                        }
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
                            mainWindow.webContents.executeJavaScript(`
                                const playButton = document.querySelector('#play-pause-button');
                                if (playButton) playButton.click();
                            `);
                        }
                    }
                },
                {
                    label: 'Next Track',
                    accelerator: 'CmdOrCtrl+Right',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript(`
                                const nextButton = document.querySelector('.next-button');
                                if (nextButton) nextButton.click();
                            `);
                        }
                    }
                },
                {
                    label: 'Previous Track',
                    accelerator: 'CmdOrCtrl+Left',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript(`
                                const prevButton = document.querySelector('.previous-button');
                                if (prevButton) prevButton.click();
                            `);
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
                                const volumeSlider = document.querySelector('#volume-slider input[type="range"]');
                                if (volumeSlider) {
                                    volumeSlider.value = Math.min(100, parseInt(volumeSlider.value) + 10);
                                    volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
                                }
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
                                const volumeSlider = document.querySelector('#volume-slider input[type="range"]');
                                if (volumeSlider) {
                                    volumeSlider.value = Math.max(0, parseInt(volumeSlider.value) - 10);
                                    volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
                                }
                            `);
                        }
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// IPC handlers for settings and controls
ipcMain.handle('get-setting', (event, key, defaultValue) => {
    return store.get(key, defaultValue);
});

ipcMain.handle('set-setting', (event, key, value) => {
    store.set(key, value);
});

ipcMain.handle('window-minimize', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
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
    if (mainWindow) {
        mainWindow.hide();
    }
});

// App event handlers
app.whenReady().then(() => {
    createWindow();
    
    // Prevent multiple instances
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        app.quit();
    } else {
        app.on('second-instance', () => {
            // Someone tried to run a second instance, focus our window instead
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();
            }
        });
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        isQuiting = true;
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    } else if (mainWindow) {
        mainWindow.show();
        if (process.platform === 'darwin') {
            app.dock.show();
        }
    }
});

app.on('before-quit', () => {
    isQuiting = true;
    // Unregister all global shortcuts
    globalShortcut.unregisterAll();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
    });
});

// Disable hardware acceleration if needed (for older systems)
if (store.get('disableHardwareAcceleration', false)) {
    app.disableHardwareAcceleration();
}
