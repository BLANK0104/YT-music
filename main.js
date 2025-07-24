const { app, BrowserWindow, session, Menu, shell } = require('electron');
const path = require('path');

let mainWindow;

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

// CSS selectors for ad elements
const adBlockingCSS = `
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
`;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true,
            allowRunningInsecureContent: false,
            experimentalFeatures: false
        },
        titleBarStyle: 'default',
        show: false
    });

    // Setup ad blocking
    setupAdBlocking();

    // Load YouTube Music
    mainWindow.loadURL('https://music.youtube.com');

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Inject ad blocking CSS
        mainWindow.webContents.insertCSS(adBlockingCSS);
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
        mainWindow.webContents.insertCSS(adBlockingCSS);
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Create application menu
    createMenu();
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
                    label: 'Quit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
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
                    click: () => {
                        if (mainWindow) {
                            mainWindow.loadURL('https://music.youtube.com');
                        }
                    }
                },
                {
                    label: 'Library',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.loadURL('https://music.youtube.com/library');
                        }
                    }
                },
                {
                    label: 'Explore',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.loadURL('https://music.youtube.com/explore');
                        }
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
    });
});
