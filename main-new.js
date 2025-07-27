/**
 * YouTube Music Desktop Application
 * Main Entry Point - Modular Architecture
 */

const { app, session, ipcMain } = require('electron');
const path = require('path');

// Handle unhandled promise rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

// Import modules
const appState = require('./src/utils/state');
const dependencies = require('./src/utils/dependencies');
const { appConstants } = require('./src/utils/constants');

const MainWindowManager = require('./src/windows/MainWindow');
const SettingsWindowManager = require('./src/windows/SettingsWindow');
const MiniPlayerWindowManager = require('./src/windows/MiniPlayerWindow');

const MenuManager = require('./src/menu/MenuManager');
const TrayManager = require('./src/modules/TrayManager');
const GlobalShortcuts = require('./src/modules/GlobalShortcuts');
const AudioEnhancer = require('./src/modules/AudioEnhancer');
const ThemeManager = require('./src/modules/ThemeManager');
const UIEnhancer = require('./src/modules/UIEnhancer');
const InactivityBypass = require('./src/modules/InactivityBypass');

// Import services
const AdBlocker = require('./src/services/AdBlocker');
const IPCHandler = require('./src/services/IPCHandler');
const DiscordService = require('./src/services/DiscordService');
const LastfmService = require('./src/services/LastfmService');

// Initialize managers
const mainWindow = new MainWindowManager();
const menuManager = new MenuManager(dependencies);
const trayManager = new TrayManager();
const globalShortcuts = new GlobalShortcuts();
const audioEnhancer = new AudioEnhancer();
const themeManager = new ThemeManager();
const uiEnhancer = new UIEnhancer();
const inactivityBypass = new InactivityBypass();
const adBlocker = new AdBlocker();
const ipcHandler = new IPCHandler();
const discordService = new DiscordService();
const lastfmService = new LastfmService();

/**
 * Create the main application window and initialize all components
 */
function createWindow() {
    const settings = appState.getSettings();
    
    // Create main window
    const window = mainWindow.create();
    
    // Show window when ready
    window.once('ready-to-show', () => {
        mainWindow.show();
        console.log('🎵 YouTube Music Desktop App loaded successfully');
        
        // Setup custom menu bar
        menuManager.createCustomMenu();
        
        // Setup system tray if enabled
        if (settings.systemTray) {
            trayManager.create();
        }
        
        // Setup global media keys if enabled
        if (settings.mediaKeys) {
            globalShortcuts.register();
        }

        // Initialize external services if enabled
        initializeServices(settings);

        // Initialize UI enhancements
        setTimeout(() => {
            initializeUIEnhancements(settings);
        }, 1000); // Wait for page to load

        // Initialize inactivity bypass
        setTimeout(() => {
            if (settings.inactivityBypass !== false) {
                inactivityBypass.initialize();
            }
        }, 3000); // Wait for YouTube Music to fully load

        // Initialize audio enhancements
        setTimeout(() => {
            initializeAudioEnhancements(settings);
        }, 2000); // Wait for page to fully load
    });
}

/**
 * Initialize external services based on settings
 */
function initializeServices(settings) {
    // Initialize Discord RPC if enabled
    if (settings.discordRPC) {
        discordService.initialize();
    }

    // Initialize Last.fm scrobbling if enabled
    if (settings.lastfmScrobbling) {
        lastfmService.initialize();
    }
}

/**
 * Initialize UI enhancements and modern glass effects
 */
function initializeUIEnhancements(settings) {
    // Enable glass morphism if selected
    if (settings.glassEffect) {
        const theme = settings.glassTheme || 'glass-dark';
        uiEnhancer.enableGlassMorphism(theme);
    }

    // Set animation level
    if (settings.animationLevel) {
        uiEnhancer.setAnimationLevel(settings.animationLevel);
    }

    console.log('✨ UI enhancements initialized');
}

/**
 * Initialize audio and visual enhancements
 */
function initializeAudioEnhancements(settings) {
    // Initialize audio features
    if (settings.equalizerEnabled) {
        audioEnhancer.setupEqualizer();
    }

    if (settings.visualizerEnabled) {
        audioEnhancer.setupVisualizer();
    }

    if (settings.audioNormalization) {
        audioEnhancer.applyAudioNormalization();
    }

    // Apply custom theme if selected
    if (settings.customTheme && settings.customTheme !== 'default') {
        themeManager.applyCustomTheme(settings.customTheme);
    }

    if (settings.visualizer) {
        audioEnhancer.setupVisualizer();
    }
    
    if (settings.audioNormalization) {
        audioEnhancer.applyAudioNormalization(true);
    }
    
    if (settings.bassBoost > 0) {
        audioEnhancer.applyBassBoost(settings.bassBoost);
    }
    
    if (settings.crossfade) {
        audioEnhancer.applyCrossfade(true);
    }
    
    if (settings.gaplessPlayback) {
        audioEnhancer.applyGaplessPlayback(true);
    }
    
    // Initialize visual features
    if (settings.customThemes) {
        const selectedTheme = appState.getSelectedTheme();
        themeManager.applyCustomTheme(selectedTheme);
    }
    
    if (settings.animatedBackground) {
        const mainWindowInstance = appState.getMainWindow();
        if (mainWindowInstance) {
            mainWindowInstance.webContents.executeJavaScript(`
                document.body.style.animation = 'backgroundShift 20s ease-in-out infinite';
                console.log('🎨 Animated background enabled');
            `);
        }
    }
    
    console.log('✨ All audio and visual enhancements initialized');
}

/**
 * Setup auto-startup management
 */
function setupAutoStart() {
    const settings = appState.getSettings();
    
    app.setLoginItemSettings({
        openAtLogin: settings.startWithWindows,
        path: process.execPath,
        args: ['--hidden']
    });
}

// App event handlers
app.whenReady().then(() => {
    console.log('🚀 Application starting...');
    console.log('📊 Dependency status:', dependencies.getDependencyStatus());
    
    // Setup ad blocking
    adBlocker.setup();
    
    // Setup IPC handlers
    ipcHandler.setup();
    
    // Create main window
    createWindow();
    
    // Setup auto-start
    setupAutoStart();

    app.on('activate', () => {
        if (require('electron').BrowserWindow.getAllWindows().length === 0) {
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
    appState.setQuiting(true);
    console.log('🛑 Application shutting down...');
});

app.on('will-quit', () => {
    // Cleanup global shortcuts
    globalShortcuts.unregisterAll();
    
    // Cleanup power save blocker
    const powerSaveId = appState.getPowerSaveId();
    if (powerSaveId) {
        const { powerSaveBlocker } = require('electron');
        powerSaveBlocker.stop(powerSaveId);
    }
    
    // Cleanup Discord RPC
    const discordClient = appState.getDiscordClient();
    if (discordClient) {
        try {
            discordClient.destroy();
        } catch (error) {
            console.error('Error destroying Discord RPC:', error);
        }
    }
    
    console.log('✅ Application cleanup completed');
});

// Export for testing
module.exports = {
    createWindow,
    mainWindow,
    menuManager,
    trayManager,
    globalShortcuts,
    adBlocker,
    ipcHandler
};
