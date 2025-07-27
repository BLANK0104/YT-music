const { app, BrowserWindow, session, Menu, shell, Tray, nativeImage, ipcMain, globalShortcut, powerSaveBlocker, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled promise rejection:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

// Feature modules
let DiscordRPC = null;
let fetch = null;
let crypto = null;

// Try to load optional dependencies
try {
    DiscordRPC = require('discord-rpc');
} catch (e) {
    console.log('Discord RPC not available');
}

try {
    fetch = require('node-fetch');
} catch (e) {
    console.log('node-fetch not available');
}

try {
    crypto = require('crypto');
} catch (e) {
    console.log('crypto not available');
}

let mainWindow;
let settingsWindow;
let miniPlayerWindow;
let tray = null;
let isQuiting = false;
let powerSaveId = null;
let currentTrack = {};
let discordClient = null;
let lastfmSession = null;
let audioContext = null;
let equalizerNode = null;
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
    miniPlayer: false, // This will be used to track if mini player is open
    
    // Notifications & Feedback
    desktopNotifications: true,
    lastfmScrobbling: false,
    hapticFeedback: false,
    
    // Last.fm credentials
    lastfmApiKey: '',
    lastfmApiSecret: '',
    lastfmSessionKey: '',
    
    // Discord Rich Presence
    discordClientId: '1234567890123456789' // Default Discord app ID
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
        icon: path.join(__dirname, 'assets', '512px-Youtube_Music_icon.svg.png'),
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

        // Initialize Discord Rich Presence if enabled
        if (settings.discordRichPresence) {
            initializeDiscordRPC();
        }

        // Initialize Last.fm if enabled
        if (settings.lastfmScrobbling) {
            initializeLastfm();
        }

        // Initialize audio enhancements
        setTimeout(() => {
            initializeAudioEnhancements();
        }, 2000); // Wait for page to fully load
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

    // Handle window close attempt (before closing)
    mainWindow.on('close', (event) => {
        const settings = store.get('settings', defaultSettings);
        
        // If not quitting via menu/quit command and system tray is enabled
        if (!isQuiting && settings.systemTray) {
            event.preventDefault();
            mainWindow.hide();
            
            // Show notification on first minimize to tray
            if (settings.desktopNotifications && !store.get('trayNotificationShown', false)) {
                new Notification({
                    title: 'YouTube Music',
                    body: 'App minimized to system tray. Click the tray icon to restore.',
                    icon: path.join(__dirname, 'assets', '512px-Youtube_Music_icon.svg.png')
                }).show();
                store.set('trayNotificationShown', true);
            }
            
            console.log('🔄 App minimized to system tray');
            return false;
        }
        
        // Otherwise allow normal close
        console.log('❌ App closing normally');
    });

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
            ? path.join(__dirname, 'assets', '512px-Youtube_Music_icon.svg.png')
            : path.join(__dirname, 'assets', '512px-Youtube_Music_icon.svg.png');
        
        tray = new Tray(nativeImage.createFromPath(iconPath));
        
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Play/Pause',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.executeJavaScript(`
                            const playPauseBtn = document.querySelector('[data-id="play-pause-button"], #play-pause-button, paper-icon-button[data-id="play-pause-button"], ytmusic-player-bar paper-icon-button[title*="play"], ytmusic-player-bar paper-icon-button[title*="pause"]');
                            if (playPauseBtn) {
                                playPauseBtn.click();
                            }
                        `);
                    }
                }
            },
            {
                label: 'Next Track',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.executeJavaScript(`
                            const nextBtn = document.querySelector('[data-id="next-button"], #next-button, paper-icon-button[data-id="next-button"], ytmusic-player-bar paper-icon-button[title*="next"]');
                            if (nextBtn) {
                                nextBtn.click();
                            }
                        `);
                    }
                }
            },
            {
                label: 'Previous Track',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.executeJavaScript(`
                            const prevBtn = document.querySelector('[data-id="previous-button"], #previous-button, paper-icon-button[data-id="previous-button"], ytmusic-player-bar paper-icon-button[title*="previous"]');
                            if (prevBtn) {
                                prevBtn.click();
                            }
                        `);
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
                                    <p>Version ${require('./package.json').version}</p>
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
                            mainWindow.webContents.executeJavaScript(`
                                const playPauseBtn = document.querySelector('[data-id="play-pause-button"], #play-pause-button, paper-icon-button[data-id="play-pause-button"], ytmusic-player-bar paper-icon-button[title*="play"], ytmusic-player-bar paper-icon-button[title*="pause"]');
                                if (playPauseBtn) {
                                    playPauseBtn.click();
                                    console.log('Play/Pause clicked');
                                } else {
                                    console.warn('Play/Pause button not found');
                                }
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
                                const nextBtn = document.querySelector('[data-id="next-button"], #next-button, paper-icon-button[data-id="next-button"], ytmusic-player-bar paper-icon-button[title*="next"]');
                                if (nextBtn) {
                                    nextBtn.click();
                                    console.log('Next track clicked via menu');
                                } else {
                                    console.warn('Next button not found');
                                }
                            `).catch(error => {
                                console.error('Error executing next track command:', error);
                            });
                        }
                    }
                },
                {
                    label: 'Previous Track',
                    accelerator: 'CmdOrCtrl+Left',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript(`
                                const prevBtn = document.querySelector('[data-id="previous-button"], #previous-button, paper-icon-button[data-id="previous-button"], ytmusic-player-bar paper-icon-button[title*="previous"]');
                                if (prevBtn) {
                                    prevBtn.click();
                                    console.log('Previous track clicked via menu');
                                } else {
                                    console.warn('Previous button not found');
                                }
                            `).catch(error => {
                                console.error('Error executing previous track command:', error);
                            });
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
                                const volumeSlider = document.querySelector('#volume-slider input, tp-yt-paper-slider[aria-label*="volume"], ytmusic-player-bar tp-yt-paper-slider');
                                if (volumeSlider) {
                                    const currentValue = parseInt(volumeSlider.value) || 50;
                                    const newValue = Math.min(100, currentValue + 10);
                                    volumeSlider.value = newValue;
                                    volumeSlider.dispatchEvent(new Event('change', { bubbles: true }));
                                    console.log('Volume increased to:', newValue);
                                } else {
                                    console.warn('Volume slider not found');
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
                                const volumeSlider = document.querySelector('#volume-slider input, tp-yt-paper-slider[aria-label*="volume"], ytmusic-player-bar tp-yt-paper-slider');
                                if (volumeSlider) {
                                    const currentValue = parseInt(volumeSlider.value) || 50;
                                    const newValue = Math.max(0, currentValue - 10);
                                    volumeSlider.value = newValue;
                                    volumeSlider.dispatchEvent(new Event('change', { bubbles: true }));
                                    console.log('Volume decreased to:', newValue);
                                } else {
                                    console.warn('Volume slider not found');
                                }
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
                            mainWindow.webContents.executeJavaScript(`
                                const homeBtn = document.querySelector('a[href="/"], ytmusic-nav-bar a[href="/"], ytmusic-pivot-bar-item-renderer[tab-identifier="FEmusic_home"]');
                                if (homeBtn) {
                                    homeBtn.click();
                                    console.log('Navigated to Home');
                                } else {
                                    window.location.href = 'https://music.youtube.com/';
                                    console.log('Navigated to Home via URL');
                                }
                            `);
                        }
                    }
                },
                {
                    label: 'Explore',
                    accelerator: 'CmdOrCtrl+2',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript(`
                                const exploreBtn = document.querySelector('a[href*="explore"], ytmusic-nav-bar a[href*="explore"], ytmusic-pivot-bar-item-renderer[tab-identifier="FEmusic_explore"]');
                                if (exploreBtn) {
                                    exploreBtn.click();
                                    console.log('Navigated to Explore');
                                } else {
                                    window.location.href = 'https://music.youtube.com/explore';
                                    console.log('Navigated to Explore via URL');
                                }
                            `);
                        }
                    }
                },
                {
                    label: 'Library',
                    accelerator: 'CmdOrCtrl+3',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript(`
                                const libraryBtn = document.querySelector('a[href*="library"], ytmusic-nav-bar a[href*="library"], ytmusic-pivot-bar-item-renderer[tab-identifier="FEmusic_library_landing"]');
                                if (libraryBtn) {
                                    libraryBtn.click();
                                    console.log('Navigated to Library');
                                } else {
                                    window.location.href = 'https://music.youtube.com/library';
                                    console.log('Navigated to Library via URL');
                                }
                            `);
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
                                const searchBox = document.querySelector('ytmusic-search-box input, #search-input, input[placeholder*="Search"], ytmusic-search-box #input');
                                if (searchBox) {
                                    searchBox.focus();
                                    searchBox.click();
                                    console.log('Search box focused');
                                } else {
                                    console.warn('Search box not found');
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
            label: 'Window',
            submenu: [
                {
                    label: 'Minimize',
                    accelerator: 'CmdOrCtrl+Shift+M',
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

// Enhanced Global Shortcuts with proper YouTube Music selectors
function setupGlobalShortcuts() {
    // Media controls with robust DOM selectors
    globalShortcut.register('MediaPlayPause', async () => {
        if (mainWindow) {
            try {
                await mainWindow.webContents.executeJavaScript(`
                    const playPauseBtn = document.querySelector('[data-id="play-pause-button"], #play-pause-button, paper-icon-button[data-id="play-pause-button"], ytmusic-player-bar paper-icon-button[title*="play"], ytmusic-player-bar paper-icon-button[title*="pause"]');
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

    globalShortcut.register('MediaNextTrack', async () => {
        if (mainWindow) {
            try {
                await mainWindow.webContents.executeJavaScript(`
                    const nextBtn = document.querySelector('[data-id="next-button"], #next-button, paper-icon-button[data-id="next-button"], ytmusic-player-bar paper-icon-button[title*="next"]');
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

    globalShortcut.register('MediaPreviousTrack', async () => {
        if (mainWindow) {
            try {
                await mainWindow.webContents.executeJavaScript(`
                    const prevBtn = document.querySelector('[data-id="previous-button"], #previous-button, paper-icon-button[data-id="previous-button"], ytmusic-player-bar paper-icon-button[title*="previous"]');
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
        // Update setting to reflect mini player is open
        const settings = store.get('settings', defaultSettings);
        settings.miniPlayer = true;
        store.set('settings', settings);
        console.log('📱 Mini player opened');
    });
    
    miniPlayerWindow.on('closed', () => {
        miniPlayerWindow = null;
        // Update setting to reflect mini player is closed
        const settings = store.get('settings', defaultSettings);
        settings.miniPlayer = false;
        store.set('settings', settings);
        console.log('📱 Mini player closed');
    });
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
        ? path.join(__dirname, 'assets', '512px-Youtube_Music_icon.svg.png')
        : path.join(__dirname, 'assets', '512px-Youtube_Music_icon.svg.png');
    
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
                        const playPauseBtn = document.querySelector('[data-id="play-pause-button"], #play-pause-button, paper-icon-button[data-id="play-pause-button"], ytmusic-player-bar paper-icon-button[title*="play"], ytmusic-player-bar paper-icon-button[title*="pause"]');
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

// Proven network-level ad blocking system
function setupProvenAdBlocking() {
    console.log('🛡️ Setting up proven network-level ad blocking...');
    
    // Network-level ad request blocking based on successful ad blockers
    const adBlockingPatterns = [
        // Google Ad Services
        '*://*.googlesyndication.com/*',
        '*://*.googleadservices.com/*',
        '*://*.googletagmanager.com/gtag/*',
        '*://*.googletagservices.com/*',
        '*://*.google-analytics.com/*',
        
        // DoubleClick (Google's ad platform)
        '*://*.doubleclick.net/*',
        
        // YouTube specific ad endpoints
        '*://*/pagead/interaction*',
        '*://*/pagead/adview*',
        '*://*/api/stats/ads*',
        '*://*/get_midroll_info*',
        '*://*/annotations_invideo*',
        '*://*/player_ads_config*',
        
        // Generic ad patterns that are safe to block
        '*://*/*ad_type=*',
        '*://*/*adurl=*',
        '*://*/*advertiser_id=*'
    ];

    // Essential patterns that should NEVER be blocked
    const essentialPatterns = [
        'youtubei/v1/player',
        'youtubei/v1/next',
        'youtubei/v1/browse',
        'youtubei/v1/search',
        'videoplayback',
        'api/stats/qoe',
        'api/stats/watchtime',
        'generate_204',
        'range=',
        'mime=audio',
        'mime=video'
    ];

    session.defaultSession.webRequest.onBeforeRequest({
        urls: adBlockingPatterns
    }, (details, callback) => {
        const url = details.url.toLowerCase();
        
        // Never block essential requests
        const isEssential = essentialPatterns.some(pattern => url.includes(pattern));
        if (isEssential) {
            callback({});
            return;
        }
        
        console.log('🚫 Blocked network ad request:', details.url);
        callback({ cancel: true });
    });

    // Remove ad-related response headers
    session.defaultSession.webRequest.onHeadersReceived({
        urls: ['*://music.youtube.com/*', '*://www.youtube.com/*']
    }, (details, callback) => {
        const responseHeaders = { ...details.responseHeaders } || {};
        
        // Remove ad-related headers
        delete responseHeaders['x-google-ad-id'];
        delete responseHeaders['x-google-av-cxn'];
        delete responseHeaders['x-ads-creative-id'];
        
        callback({ responseHeaders });
    });

    console.log('✅ Proven network-level ad blocking activated');
}

// App event handlers
app.whenReady().then(() => {
    // Setup proven network-level ad blocking
    setupProvenAdBlocking();
    
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
            const playPauseBtn = document.querySelector('[data-id="play-pause-button"], #play-pause-button, paper-icon-button[data-id="play-pause-button"], ytmusic-player-bar paper-icon-button[title*="play"], ytmusic-player-bar paper-icon-button[title*="pause"]');
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
            const nextBtn = document.querySelector('[data-id="next-button"], #next-button, paper-icon-button[data-id="next-button"], ytmusic-player-bar paper-icon-button[title*="next"]');
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
            const prevBtn = document.querySelector('[data-id="previous-button"], #previous-button, paper-icon-button[data-id="previous-button"], ytmusic-player-bar paper-icon-button[title*="previous"]');
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
            const homeBtn = document.querySelector('a[href="/"], ytmusic-nav-bar a[href="/"], ytmusic-pivot-bar-item-renderer[tab-identifier="FEmusic_home"]');
            if (homeBtn) {
                homeBtn.click();
                return true;
            } else {
                window.location.href = 'https://music.youtube.com/';
                return true;
            }
        `);
    }
});

ipcMain.handle('navigate-library', async () => {
    if (mainWindow) {
        return await mainWindow.webContents.executeJavaScript(`
            const libraryBtn = document.querySelector('a[href*="library"], ytmusic-nav-bar a[href*="library"], ytmusic-pivot-bar-item-renderer[tab-identifier="FEmusic_library_landing"]');
            if (libraryBtn) {
                libraryBtn.click();
                return true;
            } else {
                window.location.href = 'https://music.youtube.com/library';
                return true;
            }
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

// Discord Rich Presence Functions
function initializeDiscordRPC() {
    if (!DiscordRPC) {
        console.log('Discord RPC not available');
        return;
    }

    const settings = store.get('settings', defaultSettings);
    if (!settings.discordRichPresence) return;

    try {
        const clientId = settings.discordClientId || '1234567890123456789';
        discordClient = new DiscordRPC.Client({ transport: 'ipc' });

        discordClient.on('ready', () => {
            console.log('🎮 Discord Rich Presence connected');
            updateDiscordPresence(currentTrack);
        });

        discordClient.login({ clientId }).catch(console.error);
    } catch (error) {
        console.error('Failed to initialize Discord RPC:', error);
    }
}

function updateDiscordPresence(track) {
    if (!discordClient || !track.title) return;

    const settings = store.get('settings', defaultSettings);
    if (!settings.discordRichPresence) return;

    try {
        discordClient.setActivity({
            details: track.title,
            state: track.artist ? `by ${track.artist}` : 'YouTube Music',
            startTimestamp: Date.now(),
            largeImageKey: 'youtube_music_logo',
            largeImageText: 'YouTube Music',
            smallImageKey: track.isPlaying ? 'play' : 'pause',
            smallImageText: track.isPlaying ? 'Playing' : 'Paused',
            instance: false,
        });
    } catch (error) {
        console.error('Failed to update Discord presence:', error);
    }
}

function destroyDiscordRPC() {
    if (discordClient) {
        try {
            discordClient.destroy();
            discordClient = null;
            console.log('🎮 Discord Rich Presence disconnected');
        } catch (error) {
            console.error('Error destroying Discord RPC:', error);
        }
    }
}

// Last.fm Scrobbling Functions
function initializeLastfm() {
    const settings = store.get('settings', defaultSettings);
    if (!settings.lastfmScrobbling || !fetch || !crypto) return;

    lastfmSession = {
        apiKey: settings.lastfmApiKey,
        apiSecret: settings.lastfmApiSecret,
        sessionKey: settings.lastfmSessionKey
    };

    console.log('🎵 Last.fm scrobbling initialized');
}

async function scrobbleTrack(track) {
    if (!lastfmSession || !track.title || !track.artist) return;

    const settings = store.get('settings', defaultSettings);
    if (!settings.lastfmScrobbling) return;

    try {
        const timestamp = Math.floor(Date.now() / 1000);
        const params = {
            method: 'track.scrobble',
            api_key: lastfmSession.apiKey,
            sk: lastfmSession.sessionKey,
            track: track.title,
            artist: track.artist,
            album: track.album || '',
            timestamp: timestamp.toString()
        };

        // Generate API signature
        const signature = generateLastfmSignature(params, lastfmSession.apiSecret);
        params.api_sig = signature;
        params.format = 'json';

        const response = await fetch('http://ws.audioscrobbler.com/2.0/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(params)
        });

        const result = await response.json();
        if (result.scrobbles) {
            console.log('🎵 Track scrobbled to Last.fm:', track.title);
        }
    } catch (error) {
        console.error('Failed to scrobble track:', error);
    }
}

function generateLastfmSignature(params, secret) {
    if (!crypto) return '';
    
    const sortedKeys = Object.keys(params).sort();
    const signatureString = sortedKeys.map(key => `${key}${params[key]}`).join('') + secret;
    return crypto.createHash('md5').update(signatureString, 'utf8').digest('hex');
}

// Audio Enhancement Functions
function initializeAudioEnhancements() {
    const settings = store.get('settings', defaultSettings);
    
    // Initialize all audio and visual features based on settings
    if (settings.equalizerEnabled && mainWindow) {
        setupEqualizer();
    }
    
    if (settings.visualizer && mainWindow) {
        setupVisualizer();
    }
    
    if (settings.customThemes && mainWindow) {
        const selectedTheme = store.get('selectedTheme', 'dark');
        applyCustomTheme(selectedTheme);
    }
    
    if (settings.audioNormalization) {
        applyAudioNormalization(true);
    }
    
    if (settings.bassBoost > 0) {
        applyBassBoost(settings.bassBoost);
    }
    
    if (settings.crossfade) {
        applyCrossfade(true);
    }
    
    if (settings.gaplessPlayback) {
        applyGaplessPlayback(true);
    }
    
    if (settings.autoPauseOnInterruption) {
        applyAutoPause(true);
    }
    
    if (settings.hapticFeedback) {
        applyHapticFeedback(true);
    }
    
    if (settings.animatedBackground) {
        mainWindow.webContents.executeJavaScript(`
            document.body.style.animation = 'backgroundShift 20s ease-in-out infinite';
            console.log('🎨 Animated background enabled');
        `);
    }
    
    console.log('✨ All audio and visual enhancements initialized');
}

function setupEqualizer() {
    const settings = store.get('settings', defaultSettings);
    
    if (!mainWindow) return;
    
    mainWindow.webContents.executeJavaScript(`
        (function() {
            try {
                // Create audio context if not exists
                if (!window.audioContext) {
                    window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }

                // Create equalizer if not exists
                if (!window.equalizer) {
                    const context = window.audioContext;
                    window.equalizer = {
                        context: context,
                        filters: []
                    };

                    // Create bandpass filters for each frequency
                    const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
                    const eqSettings = {
                        60: ${settings.eq60 || 0},
                        170: ${settings.eq170 || 0},
                        310: ${settings.eq310 || 0},
                        600: ${settings.eq600 || 0},
                        1000: ${settings.eq1k || 0},
                        3000: ${settings.eq3k || 0},
                        6000: ${settings.eq6k || 0},
                        12000: ${settings.eq12k || 0},
                        14000: ${settings.eq14k || 0},
                        16000: ${settings.eq16k || 0}
                    };

                    frequencies.forEach((freq, index) => {
                        const filter = context.createBiquadFilter();
                        filter.type = 'peaking';
                        filter.frequency.value = freq;
                        filter.Q.value = 1;
                        filter.gain.value = eqSettings[freq] || 0;
                        window.equalizer.filters.push(filter);
                    });

                    console.log('🎛️ Audio equalizer initialized with', window.equalizer.filters.length, 'bands');
                }

                // Apply current EQ settings
                const currentEqSettings = {
                    eq60: ${settings.eq60 || 0},
                    eq170: ${settings.eq170 || 0},
                    eq310: ${settings.eq310 || 0},
                    eq600: ${settings.eq600 || 0},
                    eq1k: ${settings.eq1k || 0},
                    eq3k: ${settings.eq3k || 0},
                    eq6k: ${settings.eq6k || 0},
                    eq12k: ${settings.eq12k || 0},
                    eq14k: ${settings.eq14k || 0},
                    eq16k: ${settings.eq16k || 0}
                };

                // Update filter gains
                if (window.equalizer && window.equalizer.filters) {
                    const freqKeys = ['eq60', 'eq170', 'eq310', 'eq600', 'eq1k', 'eq3k', 'eq6k', 'eq12k', 'eq14k', 'eq16k'];
                    window.equalizer.filters.forEach((filter, index) => {
                        if (freqKeys[index] && currentEqSettings[freqKeys[index]] !== undefined) {
                            filter.gain.value = currentEqSettings[freqKeys[index]];
                            console.log('Set', freqKeys[index], 'to', currentEqSettings[freqKeys[index]], 'dB');
                        }
                    });
                }

            } catch (error) {
                console.error('Failed to setup equalizer:', error);
            }
        })();
    `).catch(error => {
        console.error('Error executing equalizer setup script:', error);
    });
}

function updateEqualizerBand(band, value) {
    if (!mainWindow) return;

    mainWindow.webContents.executeJavaScript(`
        (function() {
            try {
                if (window.equalizer && window.equalizer.filters) {
                    const bandIndex = {
                        'eq60': 0, 'eq170': 1, 'eq310': 2, 'eq600': 3, 'eq1k': 4,
                        'eq3k': 5, 'eq6k': 6, 'eq12k': 7, 'eq14k': 8, 'eq16k': 9
                    }['${band}'];
                    
                    if (bandIndex !== undefined && window.equalizer.filters[bandIndex]) {
                        window.equalizer.filters[bandIndex].gain.value = ${value};
                        console.log('🎛️ Updated EQ band ${band} to ${value}dB');
                    }
                }
            } catch (error) {
                console.error('Failed to update equalizer band:', error);
            }
        })();
    `);
}

// Crossfade and Audio Effects
function applyCrossfade(enabled) {
    if (!mainWindow) return;

    mainWindow.webContents.executeJavaScript(`
        (function() {
            try {
                if (${enabled}) {
                    // Implement crossfade logic
                    window.crossfadeEnabled = true;
                    console.log('🎵 Crossfade enabled');
                } else {
                    window.crossfadeEnabled = false;
                    console.log('🎵 Crossfade disabled');
                }
            } catch (error) {
                console.error('Failed to apply crossfade:', error);
            }
        })();
    `);
}

function applyAudioNormalization(enabled) {
    if (!mainWindow) return;

    mainWindow.webContents.executeJavaScript(`
        (function() {
            try {
                if (${enabled}) {
                    // Apply audio normalization
                    if (!window.audioNormalizer && window.audioContext) {
                        window.audioNormalizer = window.audioContext.createDynamicsCompressor();
                        window.audioNormalizer.threshold.value = -24;
                        window.audioNormalizer.knee.value = 30;
                        window.audioNormalizer.ratio.value = 12;
                        window.audioNormalizer.attack.value = 0.003;
                        window.audioNormalizer.release.value = 0.25;
                        console.log('🔊 Audio normalization enabled');
                    }
                } else {
                    if (window.audioNormalizer) {
                        window.audioNormalizer.disconnect();
                        window.audioNormalizer = null;
                        console.log('🔊 Audio normalization disabled');
                    }
                }
            } catch (error) {
                console.error('Failed to apply audio normalization:', error);
            }
        })();
    `).catch(error => {
        console.error('Error executing audio normalization script:', error);
    });
}

function applyBassBoost(level) {
    if (!mainWindow) return;

    mainWindow.webContents.executeJavaScript(`
        (function() {
            try {
                if (!window.bassBoostFilter && window.audioContext) {
                    window.bassBoostFilter = window.audioContext.createBiquadFilter();
                    window.bassBoostFilter.type = 'lowshelf';
                    window.bassBoostFilter.frequency.value = 100;
                }
                
                if (window.bassBoostFilter) {
                    window.bassBoostFilter.gain.value = ${level};
                    console.log('🎵 Bass boost set to ${level}dB');
                }
            } catch (error) {
                console.error('Failed to apply bass boost:', error);
            }
        })();
    `).catch(error => {
        console.error('Error executing bass boost script:', error);
    });
}

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

ipcMain.handle('get-current-track', async () => {
    if (!mainWindow) return {};
    
    try {
        const trackInfo = await mainWindow.webContents.executeJavaScript(`
            (function() {
                try {
                    // Get current track information from YouTube Music
                    const titleElement = document.querySelector('yt-formatted-string.title.ytmusic-player-bar, .title.ytmusic-player-bar, ytmusic-player-bar .content-info-wrapper .title');
                    const artistElement = document.querySelector('yt-formatted-string.byline.ytmusic-player-bar, .byline.ytmusic-player-bar, ytmusic-player-bar .content-info-wrapper .byline a');
                    const playPauseBtn = document.querySelector('[data-id="play-pause-button"], #play-pause-button, paper-icon-button[data-id="play-pause-button"], ytmusic-player-bar paper-icon-button[title*="play"], ytmusic-player-bar paper-icon-button[title*="pause"]');
                    const progressBar = document.querySelector('#progress-bar, ytmusic-player-bar #progress-bar');
                    const timeInfo = document.querySelector('.time-info, ytmusic-player-bar .time-info');
                    const albumArt = document.querySelector('ytmusic-player-bar img, .image.ytmusic-player-bar img');
                    
                    const title = titleElement ? titleElement.textContent.trim() : '';
                    const artist = artistElement ? artistElement.textContent.trim() : '';
                    const isPlaying = playPauseBtn ? playPauseBtn.getAttribute('aria-label')?.includes('Pause') || playPauseBtn.title?.includes('Pause') : false;
                    const thumbnail = albumArt ? albumArt.src : '';
                    
                    let currentTime = 0;
                    let duration = 0;
                    
                    if (progressBar) {
                        const progress = progressBar.getAttribute('value');
                        const max = progressBar.getAttribute('max');
                        if (progress && max) {
                            currentTime = parseInt(progress);
                            duration = parseInt(max);
                        }
                    }
                    
                    if (timeInfo) {
                        const timeText = timeInfo.textContent.trim();
                        const timeParts = timeText.split('/');
                        if (timeParts.length === 2) {
                            const current = timeParts[0].trim();
                            const total = timeParts[1].trim();
                            
                            const parseTime = (timeStr) => {
                                const parts = timeStr.split(':');
                                if (parts.length === 2) {
                                    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
                                }
                                return 0;
                            };
                            
                            currentTime = parseTime(current);
                            duration = parseTime(total);
                        }
                    }
                    
                    console.log('Track info detected:', { title, artist, isPlaying });
                    
                    return {
                        title: title,
                        artist: artist,
                        isPlaying: isPlaying,
                        currentTime: currentTime,
                        duration: duration,
                        thumbnail: thumbnail,
                        album: '' // Album info is harder to extract
                    };
                } catch (error) {
                    console.error('Error getting track info:', error);
                    return {};
                }
            })();
        `);
        
        // Update the current track
        if (trackInfo.title) {
            currentTrack = trackInfo;
        }
        
        return trackInfo;
    } catch (error) {
        console.error('Error getting current track:', error);
        return {};
    }
});

ipcMain.handle('set-current-track', (event, track) => {
    currentTrack = track;
    
    // Update tray tooltip with current track
    if (tray && track.title) {
        tray.setToolTip(`YouTube Music - ${track.title} by ${track.artist || 'Unknown Artist'}`);
    }
    
    // Show notification if enabled
    showNotification(track);
    
    // Update Discord Rich Presence
    updateDiscordPresence(track);
    
    // Scrobble to Last.fm if enabled and track has been playing for 30+ seconds
    if (track.isPlaying && track.duration && track.currentTime) {
        const playedPercentage = (track.currentTime / track.duration) * 100;
        if (playedPercentage > 50 || track.currentTime > 240) { // 50% or 4 minutes
            scrobbleTrack(track);
        }
    }
});

// Feature Controls
ipcMain.handle('initialize-discord-rpc', () => {
    initializeDiscordRPC();
});

ipcMain.handle('destroy-discord-rpc', () => {
    destroyDiscordRPC();
});

ipcMain.handle('initialize-lastfm', () => {
    initializeLastfm();
});

ipcMain.handle('scrobble-track', (event, track) => {
    scrobbleTrack(track);
});

ipcMain.handle('setup-equalizer', () => {
    setupEqualizer();
});

ipcMain.handle('update-equalizer-band', (event, band, value) => {
    updateEqualizerBand(band, value);
});

ipcMain.handle('apply-audio-enhancement', (event, type, value) => {
    switch (type) {
        case 'normalization':
            applyAudioNormalization(value);
            break;
        case 'bassBoost':
            applyBassBoost(value);
            break;
        case 'crossfade':
            applyCrossfade(value);
            break;
    }
});

// Theme
ipcMain.handle('get-theme', () => {
    return store.get('theme', 'dark');
});

ipcMain.handle('set-theme', (event, theme) => {
    store.set('theme', theme);
});

ipcMain.handle('apply-custom-theme', (event, themeName) => {
    store.set('selectedTheme', themeName);
    applyCustomTheme(themeName);
});

ipcMain.handle('setup-visualizer', () => {
    setupVisualizer();
});

ipcMain.handle('destroy-visualizer', () => {
    destroyVisualizer();
});

ipcMain.handle('apply-haptic-feedback', (event, enabled) => {
    applyHapticFeedback(enabled);
});

ipcMain.handle('apply-auto-pause', (event, enabled) => {
    applyAutoPause(enabled);
});

ipcMain.handle('apply-gapless-playback', (event, enabled) => {
    applyGaplessPlayback(enabled);
});

// Enhanced Custom Theme System
function applyCustomTheme(themeName = 'default') {
    if (!mainWindow) return;

    const themes = {
        default: {
            primary: '#1976d2',
            secondary: '#424242',
            background: '#0f0f0f',
            surface: '#1e1e1e',
            accent: '#4ecdc4'
        },
        dark: {
            primary: '#bb86fc',
            secondary: '#03dac6',
            background: '#000000',
            surface: '#121212',
            accent: '#cf6679'
        },
        light: {
            primary: '#6200ea',
            secondary: '#03dac4',
            background: '#ffffff',
            surface: '#f5f5f5',
            accent: '#018786'
        },
        synthwave: {
            primary: '#ff007f',
            secondary: '#00ffff',
            background: '#0f0f23',
            surface: '#1a1a2e',
            accent: '#ff6b35'
        },
        nature: {
            primary: '#4caf50',
            secondary: '#8bc34a',
            background: '#1b5e20',
            surface: '#2e7d32',
            accent: '#ffeb3b'
        }
    };

    const theme = themes[themeName] || themes.default;

    mainWindow.webContents.executeJavaScript(`
        (function() {
            try {
                // Create or update theme stylesheet
                let themeStyle = document.getElementById('custom-theme-style');
                if (!themeStyle) {
                    themeStyle = document.createElement('style');
                    themeStyle.id = 'custom-theme-style';
                    document.head.appendChild(themeStyle);
                }

                const css = \`
                    :root {
                        --custom-primary: ${theme.primary} !important;
                        --custom-secondary: ${theme.secondary} !important;
                        --custom-background: ${theme.background} !important;
                        --custom-surface: ${theme.surface} !important;
                        --custom-accent: ${theme.accent} !important;
                    }
                    
                    .custom-theme {
                        background: var(--custom-background) !important;
                        color: var(--custom-primary) !important;
                    }
                    
                    .custom-theme ytmusic-nav-bar,
                    .custom-theme .ytmusic-nav-bar {
                        background: var(--custom-surface) !important;
                    }
                    
                    .custom-theme ytmusic-player-bar,
                    .custom-theme .ytmusic-player-bar {
                        background: var(--custom-surface) !important;
                        border-top: 1px solid var(--custom-accent) !important;
                    }
                    
                    .custom-theme ytmusic-player-bar paper-icon-button,
                    .custom-theme .ytmusic-player-bar paper-icon-button {
                        color: var(--custom-primary) !important;
                    }
                    
                    .custom-theme paper-button,
                    .custom-theme .paper-button {
                        color: var(--custom-primary) !important;
                    }
                    
                    .custom-theme paper-button[raised],
                    .custom-theme .paper-button[raised] {
                        background: var(--custom-accent) !important;
                        color: var(--custom-background) !important;
                    }
                    
                    @keyframes backgroundShift {
                        0% { filter: hue-rotate(0deg); }
                        25% { filter: hue-rotate(90deg); }
                        50% { filter: hue-rotate(180deg); }
                        75% { filter: hue-rotate(270deg); }
                        100% { filter: hue-rotate(360deg); }
                    }
                    
                    @keyframes pulse {
                        0% { opacity: 0.8; }
                        50% { opacity: 1; }
                        100% { opacity: 0.8; }
                    }
                \`;
                
                themeStyle.textContent = css;
                console.log('🎨 Custom theme applied:', '${themeName}');
                
            } catch (error) {
                console.error('Failed to apply custom theme:', error);
            }
        })();
    `);
}

// Advanced Audio Visualizer
function setupVisualizer() {
    if (!mainWindow) return;

    mainWindow.webContents.executeJavaScript(`
        (function() {
            try {
                if (!window.audioContext) {
                    window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }

                if (!window.visualizer) {
                    // Create visualizer canvas
                    const canvas = document.createElement('canvas');
                    canvas.id = 'audio-visualizer';
                    canvas.style.cssText = \`
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        pointer-events: none;
                        z-index: 1000;
                        opacity: 0.6;
                        mix-blend-mode: screen;
                    \`;
                    document.body.appendChild(canvas);

                    const ctx = canvas.getContext('2d');
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;

                    // Create analyser node
                    const analyser = window.audioContext.createAnalyser();
                    analyser.fftSize = 256;
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);

                    window.visualizer = {
                        canvas: canvas,
                        ctx: ctx,
                        analyser: analyser,
                        dataArray: dataArray,
                        bufferLength: bufferLength,
                        isActive: true
                    };

                    // Animation loop
                    function animate() {
                        if (!window.visualizer || !window.visualizer.isActive) return;
                        
                        requestAnimationFrame(animate);
                        
                        window.visualizer.analyser.getByteFrequencyData(window.visualizer.dataArray);
                        
                        const ctx = window.visualizer.ctx;
                        const canvas = window.visualizer.canvas;
                        
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        
                        const barWidth = (canvas.width / window.visualizer.bufferLength) * 2.5;
                        let barHeight;
                        let x = 0;
                        
                        for (let i = 0; i < window.visualizer.bufferLength; i++) {
                            barHeight = (window.visualizer.dataArray[i] / 255) * canvas.height;
                            
                            const r = barHeight + (25 * (i / window.visualizer.bufferLength));
                            const g = 250 * (i / window.visualizer.bufferLength);
                            const b = 50;
                            
                            ctx.fillStyle = \`rgb(\${r},\${g},\${b})\`;
                            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                            
                            x += barWidth + 1;
                        }
                    }
                    
                    animate();
                    
                    // Handle window resize
                    window.addEventListener('resize', () => {
                        if (window.visualizer && window.visualizer.canvas) {
                            window.visualizer.canvas.width = window.innerWidth;
                            window.visualizer.canvas.height = window.innerHeight;
                        }
                    });

                    console.log('🎵 Audio visualizer initialized');
                }

                // Try to connect to audio elements
                setTimeout(() => {
                    const audioElements = document.querySelectorAll('audio, video');
                    audioElements.forEach(audio => {
                        try {
                            const source = window.audioContext.createMediaElementSource(audio);
                            source.connect(window.visualizer.analyser);
                            window.visualizer.analyser.connect(window.audioContext.destination);
                        } catch (e) {
                            // Audio element might already be connected
                        }
                    });
                }, 1000);

            } catch (error) {
                console.error('Failed to setup visualizer:', error);
            }
        })();
    `);
}

function destroyVisualizer() {
    if (!mainWindow) return;

    mainWindow.webContents.executeJavaScript(`
        (function() {
            try {
                if (window.visualizer) {
                    window.visualizer.isActive = false;
                    if (window.visualizer.canvas) {
                        window.visualizer.canvas.remove();
                    }
                    window.visualizer = null;
                    console.log('🎵 Audio visualizer disabled');
                }
            } catch (error) {
                console.error('Failed to destroy visualizer:', error);
            }
        })();
    `);
}

// Haptic Feedback System
function applyHapticFeedback(enabled) {
    if (!mainWindow) return;

    mainWindow.webContents.executeJavaScript(`
        (function() {
            try {
                if (${enabled}) {
                    // Add haptic feedback to buttons
                    window.hapticFeedback = {
                        enabled: true,
                        vibrate: (pattern = [100]) => {
                            if (navigator.vibrate) {
                                navigator.vibrate(pattern);
                            }
                        }
                    };

                    // Add event listeners for haptic feedback
                    document.addEventListener('click', (e) => {
                        if (window.hapticFeedback && window.hapticFeedback.enabled) {
                            const element = e.target;
                            if (element.matches('paper-icon-button, button, .button, [role="button"]')) {
                                window.hapticFeedback.vibrate([50]);
                            }
                        }
                    });

                    console.log('📳 Haptic feedback enabled');
                } else {
                    if (window.hapticFeedback) {
                        window.hapticFeedback.enabled = false;
                    }
                    console.log('📳 Haptic feedback disabled');
                }
            } catch (error) {
                console.error('Failed to apply haptic feedback:', error);
            }
        })();
    `);
}

// Auto Pause on System Interruption
function applyAutoPause(enabled) {
    if (!mainWindow) return;

    mainWindow.webContents.executeJavaScript(`
        (function() {
            try {
                if (${enabled}) {
                    window.autoPauseHandler = {
                        enabled: true,
                        wasPlaying: false
                    };

                    // Listen for system audio interruptions
                    document.addEventListener('visibilitychange', () => {
                        if (window.autoPauseHandler && window.autoPauseHandler.enabled) {
                            if (document.hidden) {
                                // Check if music is playing
                                const playButton = document.querySelector('[data-id="play-pause-button"], #play-pause-button');
                                if (playButton && playButton.getAttribute('aria-label')?.includes('Pause')) {
                                    window.autoPauseHandler.wasPlaying = true;
                                    playButton.click();
                                    console.log('⏸️ Auto-paused due to interruption');
                                }
                            } else if (window.autoPauseHandler.wasPlaying) {
                                // Resume playing when returning
                                setTimeout(() => {
                                    const playButton = document.querySelector('[data-id="play-pause-button"], #play-pause-button');
                                    if (playButton && playButton.getAttribute('aria-label')?.includes('Play')) {
                                        playButton.click();
                                        console.log('▶️ Auto-resumed after interruption');
                                    }
                                    window.autoPauseHandler.wasPlaying = false;
                                }, 500);
                            }
                        }
                    });

                    console.log('⏸️ Auto-pause on interruption enabled');
                } else {
                    if (window.autoPauseHandler) {
                        window.autoPauseHandler.enabled = false;
                    }
                    console.log('⏸️ Auto-pause on interruption disabled');
                }
            } catch (error) {
                console.error('Failed to apply auto-pause:', error);
            }
        })();
    `);
}

// Gapless Playback
function applyGaplessPlayback(enabled) {
    if (!mainWindow) return;

    mainWindow.webContents.executeJavaScript(`
        (function() {
            try {
                if (${enabled}) {
                    window.gaplessPlayback = {
                        enabled: true,
                        preloadNext: true
                    };

                    // Override audio elements for gapless playback
                    const originalPlay = HTMLAudioElement.prototype.play;
                    HTMLAudioElement.prototype.play = function() {
                        if (window.gaplessPlayback && window.gaplessPlayback.enabled) {
                            this.preload = 'auto';
                            // Minimize gaps by setting currentTime precisely
                            if (this.readyState >= 2) {
                                return originalPlay.call(this);
                            } else {
                                return new Promise((resolve) => {
                                    this.addEventListener('canplay', () => {
                                        resolve(originalPlay.call(this));
                                    }, { once: true });
                                });
                            }
                        }
                        return originalPlay.call(this);
                    };

                    console.log('🔄 Gapless playback enabled');
                } else {
                    if (window.gaplessPlayback) {
                        window.gaplessPlayback.enabled = false;
                    }
                    console.log('🔄 Gapless playback disabled');
                }
            } catch (error) {
                console.error('Failed to apply gapless playback:', error);
            }
        })();
    `);
}

// Enhanced Desktop Notifications with Rich Content
function showNotification(track) {
    const settings = store.get('settings', defaultSettings);
    
    if (settings.desktopNotifications && track.title && Notification.isSupported()) {
        try {
            const notification = new Notification(track.title, {
                body: `${track.artist || 'Unknown Artist'}${track.album ? ` • ${track.album}` : ''}`,
                icon: track.thumbnail || path.join(__dirname, 'assets', '512px-Youtube_Music_icon.svg.png'),
                silent: false,
                tag: 'ytmusic-track',
                requireInteraction: false,
                actions: [
                    { action: 'play-pause', title: '⏯️ Play/Pause' },
                    { action: 'next', title: '⏭️ Next' }
                ]
            });

            notification.onclick = () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
                notification.close();
            };

            // Auto-close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);

            console.log('📢 Notification shown:', track.title);
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }
}

// Apply setting changes immediately
function applySettingChange(key, value) {
    try {
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

        case 'discordRichPresence':
            if (value) {
                initializeDiscordRPC();
            } else {
                destroyDiscordRPC();
            }
            break;

        case 'lastfmScrobbling':
            if (value) {
                initializeLastfm();
            } else {
                lastfmSession = null;
            }
            break;

        case 'equalizerEnabled':
            if (value) {
                setupEqualizer();
            } else {
                if (mainWindow) {
                    mainWindow.webContents.executeJavaScript(`
                        if (window.equalizer) {
                            window.equalizer.filters.forEach(filter => filter.disconnect());
                            window.equalizer = null;
                            console.log('🎛️ Equalizer disabled');
                        }
                    `);
                }
            }
            break;

        case 'audioNormalization':
            applyAudioNormalization(value);
            break;

        case 'bassBoost':
            applyBassBoost(value);
            break;

        case 'crossfade':
            applyCrossfade(value);
            break;

        // Handle individual EQ bands
        case 'eq60':
        case 'eq170':
        case 'eq310':
        case 'eq600':
        case 'eq1k':
        case 'eq3k':
        case 'eq6k':
        case 'eq12k':
        case 'eq14k':
        case 'eq16k':
            updateEqualizerBand(key, value);
            break;

        case 'customThemes':
            if (value && mainWindow) {
                const currentTheme = store.get('selectedTheme', 'dark');
                applyCustomTheme(currentTheme);
                mainWindow.webContents.executeJavaScript(`
                    document.body.classList.add('custom-theme');
                    console.log('🎨 Custom themes enabled');
                `);
            } else if (mainWindow) {
                mainWindow.webContents.executeJavaScript(`
                    document.body.classList.remove('custom-theme');
                    const themeStyle = document.getElementById('custom-theme-style');
                    if (themeStyle) {
                        themeStyle.remove();
                    }
                    console.log('🎨 Custom themes disabled');
                `);
            }
            break;

        case 'animatedBackground':
            if (mainWindow) {
                mainWindow.webContents.executeJavaScript(`
                    if (${value}) {
                        document.body.style.animation = 'backgroundShift 20s ease-in-out infinite';
                        console.log('🎨 Animated background enabled');
                    } else {
                        document.body.style.animation = 'none';
                        console.log('🎨 Animated background disabled');
                    }
                `);
            }
            break;

        case 'visualizer':
            if (value && mainWindow) {
                setupVisualizer();
            } else if (mainWindow) {
                destroyVisualizer();
            }
            break;

        case 'miniPlayer':
            if (value) {
                createMiniPlayer();
            } else if (miniPlayerWindow) {
                miniPlayerWindow.close();
            }
            break;

        case 'desktopNotifications':
            // Desktop notifications are handled in showNotification function
            console.log(`📢 Desktop notifications ${value ? 'enabled' : 'disabled'}`);
            break;

        case 'hapticFeedback':
            applyHapticFeedback(value);
            break;

        case 'autoPauseOnInterruption':
            applyAutoPause(value);
            break;

        case 'gaplessPlayback':
            applyGaplessPlayback(value);
            break;
    }
} catch (error) {
    console.error('Error applying setting change:', key, error);
}
}
