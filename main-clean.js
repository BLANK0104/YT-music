const { app, BrowserWindow, session, Menu, shell, Tray, nativeImage, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const Store = require('electron-store');

let mainWindow;
let tray = null;
let isQuiting = false;
const store = new Store();

function createWindow() {
    // Get stored window bounds or use defaults
    const windowBounds = store.get('windowBounds', { width: 1400, height: 900 });
    
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
        console.log('🎵 YouTube Music Desktop App loaded successfully');
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

// Settings
ipcMain.handle('get-setting', (event, key, defaultValue) => {
    return store.get(key, defaultValue);
});

ipcMain.handle('set-setting', (event, key, value) => {
    store.set(key, value);
});

// Theme
ipcMain.handle('get-theme', () => {
    return store.get('theme', 'dark');
});

ipcMain.handle('set-theme', (event, theme) => {
    store.set('theme', theme);
});
