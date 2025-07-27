/**
 * Application Menu Management
 */

const { Menu, BrowserWindow, shell, app, globalShortcut } = require('electron');
const path = require('path');
const appState = require('../utils/state');
const { appConstants } = require('../utils/constants');

class MenuManager {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }

    createCustomMenu() {
        const template = [
            this.createAppMenu(),
            this.createPlaybackMenu(),
            this.createNavigationMenu(),
            this.createViewMenu(),
            this.createWindowMenu(),
            this.createHelpMenu()
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
        
        console.log('📋 Custom menu bar created with YouTube Music features');
    }

    createAppMenu() {
        return {
            label: appConstants.APP_NAME,
            submenu: [
                {
                    label: `About ${appConstants.APP_NAME}`,
                    click: () => this.showAboutDialog()
                },
                { type: 'separator' },
                this.createSettingsSubmenu(),
                { type: 'separator' },
                {
                    label: `Hide ${appConstants.APP_NAME}`,
                    accelerator: process.platform === 'darwin' ? 'Cmd+H' : 'Ctrl+H',
                    click: () => {
                        const mainWindow = appState.getMainWindow();
                        if (mainWindow) mainWindow.hide();
                    }
                },
                {
                    label: `Quit ${appConstants.APP_NAME}`,
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        appState.setQuiting(true);
                        app.quit();
                    }
                }
            ]
        };
    }

    createSettingsSubmenu() {
        return {
            label: 'Settings',
            submenu: [
                {
                    label: 'System Integration',
                    submenu: this.createSystemIntegrationSubmenu()
                },
                {
                    label: 'Audio & Playback',
                    submenu: this.createAudioPlaybackSubmenu()
                },
                {
                    label: 'Interface & Visual',
                    submenu: this.createInterfaceVisualSubmenu()
                },
                {
                    label: 'External Services',
                    submenu: this.createExternalServicesSubmenu()
                },
                { type: 'separator' },
                {
                    label: 'Advanced Settings',
                    click: () => {
                        const SettingsWindow = require('../windows/SettingsWindow');
                        const settingsWindow = new SettingsWindow();
                        settingsWindow.create();
                    }
                }
            ]
        };
    }

    createSystemIntegrationSubmenu() {
        const settings = appState.getSettings();
        return [
            {
                label: 'System Tray',
                type: 'checkbox',
                checked: settings.systemTray,
                click: (menuItem) => this.handleSystemTraySetting(menuItem.checked)
            },
            {
                label: 'Start with Windows',
                type: 'checkbox',
                checked: settings.startWithWindows,
                click: (menuItem) => this.handleStartWithWindowsSetting(menuItem.checked)
            },
            {
                label: 'Global Media Keys',
                type: 'checkbox',
                checked: settings.mediaKeys,
                click: (menuItem) => this.handleMediaKeysSetting(menuItem.checked)
            }
        ];
    }

    createAudioPlaybackSubmenu() {
        const settings = appState.getSettings();
        return [
            {
                label: 'Background Playback',
                type: 'checkbox',
                checked: settings.backgroundPlay,
                click: (menuItem) => this.handleBackgroundPlaySetting(menuItem.checked)
            },
            {
                label: 'Audio Normalization',
                type: 'checkbox',
                checked: settings.audioNormalization,
                click: (menuItem) => this.handleAudioNormalizationSetting(menuItem.checked)
            },
            {
                label: 'Gapless Playback',
                type: 'checkbox',
                checked: settings.gaplessPlayback,
                click: (menuItem) => this.handleGaplessPlaybackSetting(menuItem.checked)
            },
            {
                label: 'Crossfade',
                type: 'checkbox',
                checked: settings.crossfade,
                click: (menuItem) => this.handleCrossfadeSetting(menuItem.checked)
            },
            {
                label: 'Equalizer',
                type: 'checkbox',
                checked: settings.equalizerEnabled,
                click: (menuItem) => this.handleEqualizerSetting(menuItem.checked)
            }
        ];
    }

    createInterfaceVisualSubmenu() {
        const settings = appState.getSettings();
        return [
            {
                label: 'Desktop Notifications',
                type: 'checkbox',
                checked: settings.desktopNotifications,
                click: (menuItem) => this.handleDesktopNotificationsSetting(menuItem.checked)
            },
            {
                label: 'Animated Background',
                type: 'checkbox',
                checked: settings.animatedBackground,
                click: (menuItem) => this.handleAnimatedBackgroundSetting(menuItem.checked)
            },
            {
                label: 'Custom Themes',
                type: 'checkbox',
                checked: settings.customThemes,
                click: (menuItem) => this.handleCustomThemesSetting(menuItem.checked)
            },
            {
                label: 'Visualizer',
                type: 'checkbox',
                checked: settings.visualizer,
                click: (menuItem) => this.handleVisualizerSetting(menuItem.checked)
            }
        ];
    }

    createExternalServicesSubmenu() {
        const settings = appState.getSettings();
        return [
            {
                label: 'Discord Rich Presence',
                type: 'checkbox',
                checked: settings.discordRichPresence,
                enabled: this.dependencies.isDiscordRPCAvailable(),
                click: (menuItem) => this.handleDiscordRPCSetting(menuItem.checked)
            },
            {
                label: 'Last.fm Scrobbling',
                type: 'checkbox',
                checked: settings.lastfmScrobbling,
                enabled: this.dependencies.isLastfmAvailable(),
                click: (menuItem) => this.handleLastfmSetting(menuItem.checked)
            }
        ];
    }

    createPlaybackMenu() {
        return {
            label: 'Playback',
            submenu: [
                {
                    label: 'Play/Pause',
                    accelerator: 'Space',
                    click: () => this.executeMediaCommand(appConstants.SELECTORS.PLAY_PAUSE, 'Play/Pause')
                },
                {
                    label: 'Next Track',
                    accelerator: 'CmdOrCtrl+Right',
                    click: () => this.executeMediaCommand(appConstants.SELECTORS.NEXT, 'Next track')
                },
                {
                    label: 'Previous Track',
                    accelerator: 'CmdOrCtrl+Left',
                    click: () => this.executeMediaCommand(appConstants.SELECTORS.PREVIOUS, 'Previous track')
                },
                { type: 'separator' },
                {
                    label: 'Volume Up',
                    accelerator: 'CmdOrCtrl+Up',
                    click: () => this.adjustVolume(10)
                },
                {
                    label: 'Volume Down',
                    accelerator: 'CmdOrCtrl+Down',
                    click: () => this.adjustVolume(-10)
                }
            ]
        };
    }

    createNavigationMenu() {
        return {
            label: 'Navigation',
            submenu: [
                {
                    label: 'Home',
                    accelerator: 'CmdOrCtrl+1',
                    click: () => this.navigateTo(appConstants.SELECTORS.HOME, '/')
                },
                {
                    label: 'Explore',
                    accelerator: 'CmdOrCtrl+2',
                    click: () => this.navigateTo(appConstants.SELECTORS.EXPLORE, '/explore')
                },
                {
                    label: 'Library',
                    accelerator: 'CmdOrCtrl+3',
                    click: () => this.navigateTo(appConstants.SELECTORS.LIBRARY, '/library')
                },
                { type: 'separator' },
                {
                    label: 'Search',
                    accelerator: 'CmdOrCtrl+F',
                    click: () => this.focusSearch()
                }
            ]
        };
    }

    createViewMenu() {
        return {
            label: 'View',
            submenu: [
                {
                    label: 'Mini Player',
                    accelerator: 'CmdOrCtrl+M',
                    click: () => {
                        const MiniPlayerWindow = require('../windows/MiniPlayerWindow');
                        const miniPlayer = new MiniPlayerWindow();
                        miniPlayer.create();
                    }
                },
                {
                    label: 'Always on Top',
                    type: 'checkbox',
                    click: (menuItem) => {
                        const mainWindow = appState.getMainWindow();
                        if (mainWindow) {
                            mainWindow.setAlwaysOnTop(menuItem.checked);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: '🎨 Glass Effects',
                    submenu: [
                        {
                            label: 'Enable Glass Morphism',
                            type: 'checkbox',
                            checked: this.store.get('glassEffect', true),
                            click: async () => {
                                const enabled = !this.store.get('glassEffect', true);
                                this.store.set('glassEffect', enabled);
                                
                                const UIEnhancer = require('../modules/UIEnhancer');
                                const uiEnhancer = new UIEnhancer();
                                
                                if (enabled) {
                                    const theme = this.store.get('glassTheme', 'glass-dark');
                                    await uiEnhancer.enableGlassMorphism(theme);
                                } else {
                                    await uiEnhancer.disableGlassMorphism();
                                }
                                
                                this.updateMenus();
                            }
                        },
                        { type: 'separator' },
                        {
                            label: 'Glass Dark',
                            type: 'radio',
                            checked: this.store.get('glassTheme', 'glass-dark') === 'glass-dark',
                            click: async () => {
                                this.store.set('glassTheme', 'glass-dark');
                                if (this.store.get('glassEffect', true)) {
                                    const UIEnhancer = require('../modules/UIEnhancer');
                                    const uiEnhancer = new UIEnhancer();
                                    await uiEnhancer.enableGlassMorphism('glass-dark');
                                }
                                this.updateMenus();
                            }
                        },
                        {
                            label: 'Glass Light',
                            type: 'radio',
                            checked: this.store.get('glassTheme', 'glass-dark') === 'glass-light',
                            click: async () => {
                                this.store.set('glassTheme', 'glass-light');
                                if (this.store.get('glassEffect', true)) {
                                    const UIEnhancer = require('../modules/UIEnhancer');
                                    const uiEnhancer = new UIEnhancer();
                                    await uiEnhancer.enableGlassMorphism('glass-light');
                                }
                                this.updateMenus();
                            }
                        },
                        {
                            label: 'Glass Purple',
                            type: 'radio',
                            checked: this.store.get('glassTheme', 'glass-dark') === 'glass-purple',
                            click: async () => {
                                this.store.set('glassTheme', 'glass-purple');
                                if (this.store.get('glassEffect', true)) {
                                    const UIEnhancer = require('../modules/UIEnhancer');
                                    const uiEnhancer = new UIEnhancer();
                                    await uiEnhancer.enableGlassMorphism('glass-purple');
                                }
                                this.updateMenus();
                            }
                        },
                        {
                            label: 'Glass Blue',
                            type: 'radio',
                            checked: this.store.get('glassTheme', 'glass-dark') === 'glass-blue',
                            click: async () => {
                                this.store.set('glassTheme', 'glass-blue');
                                if (this.store.get('glassEffect', true)) {
                                    const UIEnhancer = require('../modules/UIEnhancer');
                                    const uiEnhancer = new UIEnhancer();
                                    await uiEnhancer.enableGlassMorphism('glass-blue');
                                }
                                this.updateMenus();
                            }
                        }
                    ]
                },
                {
                    label: '✨ Animations',
                    submenu: [
                        {
                            label: 'None',
                            type: 'radio',
                            checked: this.store.get('animationLevel', 'medium') === 'none',
                            click: async () => {
                                this.store.set('animationLevel', 'none');
                                const UIEnhancer = require('../modules/UIEnhancer');
                                const uiEnhancer = new UIEnhancer();
                                await uiEnhancer.setAnimationLevel('none');
                                this.updateMenus();
                            }
                        },
                        {
                            label: 'Minimal',
                            type: 'radio',
                            checked: this.store.get('animationLevel', 'medium') === 'minimal',
                            click: async () => {
                                this.store.set('animationLevel', 'minimal');
                                const UIEnhancer = require('../modules/UIEnhancer');
                                const uiEnhancer = new UIEnhancer();
                                await uiEnhancer.setAnimationLevel('minimal');
                                this.updateMenus();
                            }
                        },
                        {
                            label: 'Medium',
                            type: 'radio',
                            checked: this.store.get('animationLevel', 'medium') === 'medium',
                            click: async () => {
                                this.store.set('animationLevel', 'medium');
                                const UIEnhancer = require('../modules/UIEnhancer');
                                const uiEnhancer = new UIEnhancer();
                                await uiEnhancer.setAnimationLevel('medium');
                                this.updateMenus();
                            }
                        },
                        {
                            label: 'Full',
                            type: 'radio',
                            checked: this.store.get('animationLevel', 'medium') === 'full',
                            click: async () => {
                                this.store.set('animationLevel', 'full');
                                const UIEnhancer = require('../modules/UIEnhancer');
                                const uiEnhancer = new UIEnhancer();
                                await uiEnhancer.setAnimationLevel('full');
                                this.updateMenus();
                            }
                        }
                    ]
                },
                { type: 'separator' },
                {
                    label: '🎵 Continuous Playback',
                    submenu: [
                        {
                            label: 'Bypass Inactivity Popup',
                            type: 'checkbox',
                            checked: this.store.get('inactivityBypass', true),
                            click: () => {
                                const enabled = !this.store.get('inactivityBypass', true);
                                this.store.set('inactivityBypass', enabled);
                                
                                const InactivityBypass = require('../modules/InactivityBypass');
                                const inactivityBypass = new InactivityBypass();
                                inactivityBypass.setEnabled(enabled);
                                
                                this.updateMenus();
                            }
                        }
                    ]
                },
                { type: 'separator' },
                {
                    label: 'Actual Size',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        const mainWindow = appState.getMainWindow();
                        if (mainWindow) {
                            mainWindow.webContents.setZoomLevel(0);
                        }
                    }
                },
                {
                    label: 'Zoom In',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        const mainWindow = appState.getMainWindow();
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
                        const mainWindow = appState.getMainWindow();
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
                        const mainWindow = appState.getMainWindow();
                        if (mainWindow) {
                            mainWindow.setFullScreen(!mainWindow.isFullScreen());
                        }
                    }
                }
            ]
        };
    }

    createWindowMenu() {
        return {
            label: 'Window',
            submenu: [
                {
                    label: 'Minimize',
                    accelerator: 'CmdOrCtrl+Shift+M',
                    click: () => {
                        const mainWindow = appState.getMainWindow();
                        if (mainWindow) {
                            mainWindow.minimize();
                        }
                    }
                },
                {
                    label: 'Close',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => {
                        const mainWindow = appState.getMainWindow();
                        if (mainWindow) {
                            mainWindow.close();
                        }
                    }
                }
            ]
        };
    }

    createHelpMenu() {
        return {
            label: 'Help',
            submenu: [
                {
                    label: 'Keyboard Shortcuts',
                    click: () => this.showShortcutsDialog()
                },
                { type: 'separator' },
                {
                    label: 'GitHub Repository',
                    click: () => {
                        shell.openExternal('https://github.com/BLANK0104/YT-music');
                    }
                }
            ]
        };
    }

    // Helper methods for menu actions
    executeMediaCommand(selector, action) {
        const mainWindow = appState.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript(`
                const btn = document.querySelector('${selector}');
                if (btn) {
                    btn.click();
                    console.log('${action} clicked via menu');
                } else {
                    console.warn('${action} button not found');
                }
            `).catch(error => {
                console.error(`Error executing ${action} command:`, error);
            });
        }
    }

    adjustVolume(delta) {
        const mainWindow = appState.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript(`
                const volumeSlider = document.querySelector('${appConstants.SELECTORS.VOLUME}');
                if (volumeSlider) {
                    const currentValue = parseInt(volumeSlider.value) || 50;
                    const newValue = Math.max(0, Math.min(100, currentValue + ${delta}));
                    volumeSlider.value = newValue;
                    volumeSlider.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('Volume ${delta > 0 ? 'increased' : 'decreased'} to:', newValue);
                } else {
                    console.warn('Volume slider not found');
                }
            `);
        }
    }

    navigateTo(selector, fallbackUrl) {
        const mainWindow = appState.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript(`
                const btn = document.querySelector('${selector}');
                if (btn) {
                    btn.click();
                    console.log('Navigated via button');
                } else {
                    window.location.href = '${appConstants.YOUTUBE_MUSIC_URL}${fallbackUrl}';
                    console.log('Navigated via URL');
                }
            `);
        }
    }

    focusSearch() {
        const mainWindow = appState.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript(`
                const searchBox = document.querySelector('${appConstants.SELECTORS.SEARCH}');
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

    // Setting handlers
    handleSystemTraySetting(enabled) {
        appState.setSetting('systemTray', enabled);
        if (enabled) {
            const TrayManager = require('../modules/TrayManager');
            const trayManager = new TrayManager();
            trayManager.create();
            console.log('✅ System tray enabled');
        } else {
            const tray = appState.getTray();
            if (tray) {
                tray.destroy();
                appState.setTray(null);
                console.log('❌ System tray disabled');
            }
        }
        this.refreshMenu();
    }

    handleStartWithWindowsSetting(enabled) {
        appState.setSetting('startWithWindows', enabled);
        app.setLoginItemSettings({
            openAtLogin: enabled,
            path: process.execPath,
            args: ['--hidden']
        });
        console.log(enabled ? '✅ Auto-start enabled' : '❌ Auto-start disabled');
        this.refreshMenu();
    }

    handleMediaKeysSetting(enabled) {
        appState.setSetting('mediaKeys', enabled);
        if (enabled) {
            const GlobalShortcuts = require('../modules/GlobalShortcuts');
            const globalShortcuts = new GlobalShortcuts();
            globalShortcuts.register();
            console.log('✅ Global media keys enabled');
        } else {
            globalShortcut.unregisterAll();
            console.log('❌ Global media keys disabled');
        }
        this.refreshMenu();
    }

    handleBackgroundPlaySetting(enabled) {
        appState.setSetting('backgroundPlay', enabled);
        const { powerSaveBlocker } = require('electron');
        
        if (enabled) {
            if (!appState.getPowerSaveId()) {
                const powerSaveId = powerSaveBlocker.start('prevent-app-suspension');
                appState.setPowerSaveId(powerSaveId);
                console.log('✅ Background playback enabled');
            }
        } else {
            const powerSaveId = appState.getPowerSaveId();
            if (powerSaveId) {
                powerSaveBlocker.stop(powerSaveId);
                appState.setPowerSaveId(null);
                console.log('❌ Background playback disabled');
            }
        }
        this.refreshMenu();
    }

    handleAudioNormalizationSetting(enabled) {
        appState.setSetting('audioNormalization', enabled);
        const AudioEnhancer = require('../modules/AudioEnhancer');
        const audioEnhancer = new AudioEnhancer();
        audioEnhancer.applyAudioNormalization(enabled);
        console.log(enabled ? '✅ Audio normalization enabled' : '❌ Audio normalization disabled');
        this.refreshMenu();
    }

    handleGaplessPlaybackSetting(enabled) {
        appState.setSetting('gaplessPlayback', enabled);
        const AudioEnhancer = require('../modules/AudioEnhancer');
        const audioEnhancer = new AudioEnhancer();
        audioEnhancer.applyGaplessPlayback(enabled);
        console.log(enabled ? '✅ Gapless playback enabled' : '❌ Gapless playback disabled');
        this.refreshMenu();
    }

    handleCrossfadeSetting(enabled) {
        appState.setSetting('crossfade', enabled);
        const AudioEnhancer = require('../modules/AudioEnhancer');
        const audioEnhancer = new AudioEnhancer();
        audioEnhancer.applyCrossfade(enabled);
        console.log(enabled ? '✅ Crossfade enabled' : '❌ Crossfade disabled');
        this.refreshMenu();
    }

    handleEqualizerSetting(enabled) {
        appState.setSetting('equalizerEnabled', enabled);
        const AudioEnhancer = require('../modules/AudioEnhancer');
        const audioEnhancer = new AudioEnhancer();
        
        if (enabled) {
            audioEnhancer.setupEqualizer();
            console.log('✅ Equalizer enabled');
        } else {
            audioEnhancer.disableEqualizer();
            console.log('❌ Equalizer disabled');
        }
        this.refreshMenu();
    }

    handleDesktopNotificationsSetting(enabled) {
        appState.setSetting('desktopNotifications', enabled);
        console.log(enabled ? '✅ Desktop notifications enabled' : '❌ Desktop notifications disabled');
        this.refreshMenu();
    }

    handleAnimatedBackgroundSetting(enabled) {
        appState.setSetting('animatedBackground', enabled);
        const mainWindow = appState.getMainWindow();
        
        if (mainWindow) {
            if (enabled) {
                mainWindow.webContents.executeJavaScript(`
                    document.body.style.animation = 'backgroundShift 20s ease-in-out infinite';
                    console.log('✅ Animated background enabled');
                `);
            } else {
                mainWindow.webContents.executeJavaScript(`
                    document.body.style.animation = '';
                    console.log('❌ Animated background disabled');
                `);
            }
        }
        this.refreshMenu();
    }

    handleCustomThemesSetting(enabled) {
        appState.setSetting('customThemes', enabled);
        const ThemeManager = require('../modules/ThemeManager');
        const themeManager = new ThemeManager();
        
        if (enabled) {
            const selectedTheme = appState.getSelectedTheme();
            themeManager.applyCustomTheme(selectedTheme);
            console.log('✅ Custom themes enabled');
        } else {
            themeManager.resetTheme();
            console.log('❌ Custom themes disabled');
        }
        this.refreshMenu();
    }

    handleVisualizerSetting(enabled) {
        appState.setSetting('visualizer', enabled);
        const AudioEnhancer = require('../modules/AudioEnhancer');
        const audioEnhancer = new AudioEnhancer();
        
        if (enabled) {
            audioEnhancer.setupVisualizer();
            console.log('✅ Visualizer enabled');
        } else {
            audioEnhancer.disableVisualizer();
            console.log('❌ Visualizer disabled');
        }
        this.refreshMenu();
    }

    handleDiscordRPCSetting(enabled) {
        appState.setSetting('discordRichPresence', enabled);
        const DiscordService = require('../services/DiscordService');
        const discordService = new DiscordService(this.dependencies);
        
        if (enabled) {
            discordService.initialize();
            console.log('✅ Discord Rich Presence enabled');
        } else {
            discordService.destroy();
            console.log('❌ Discord Rich Presence disabled');
        }
        this.refreshMenu();
    }

    handleLastfmSetting(enabled) {
        appState.setSetting('lastfmScrobbling', enabled);
        
        if (enabled) {
            const settings = appState.getSettings();
            if (settings.lastfmApiKey && settings.lastfmApiSecret) {
                const LastfmService = require('../services/LastfmService');
                const lastfmService = new LastfmService(this.dependencies);
                lastfmService.initialize();
                console.log('✅ Last.fm scrobbling enabled');
            } else {
                this.showLastfmSetupDialog();
                appState.setSetting('lastfmScrobbling', false);
            }
        } else {
            console.log('❌ Last.fm scrobbling disabled');
        }
        this.refreshMenu();
    }

    showAboutDialog() {
        const aboutWindow = new BrowserWindow({
            width: appConstants.ABOUT_WINDOW_SIZE.width,
            height: appConstants.ABOUT_WINDOW_SIZE.height,
            parent: appState.getMainWindow(),
            modal: true,
            webPreferences: { nodeIntegration: true },
            titleBarStyle: 'default',
            show: false
        });
        
        aboutWindow.loadURL(`data:text/html,
            <html>
                <head><title>About</title></head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; padding: 40px; text-align: center; background: #0f0f0f; color: white;">
                    <h2>${appConstants.APP_NAME}</h2>
                    <p>Version ${require('../../../package.json').version}</p>
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

    showShortcutsDialog() {
        const shortcutsWindow = new BrowserWindow({
            width: appConstants.SHORTCUTS_WINDOW_SIZE.width,
            height: appConstants.SHORTCUTS_WINDOW_SIZE.height,
            parent: appState.getMainWindow(),
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

    showLastfmSetupDialog() {
        const credentialsWindow = new BrowserWindow({
            width: 400,
            height: 300,
            parent: appState.getMainWindow(),
            modal: true,
            webPreferences: { nodeIntegration: true },
            titleBarStyle: 'default',
            show: false
        });
        
        credentialsWindow.loadURL(`data:text/html,
            <html>
                <head><title>Last.fm Setup</title></head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; padding: 20px; background: #0f0f0f; color: white;">
                    <h3>Last.fm Setup Required</h3>
                    <p>To enable Last.fm scrobbling, you need to:</p>
                    <ol>
                        <li>Create a Last.fm API account at <a href="https://www.last.fm/api/account/create" style="color: #4ecdc4;">last.fm/api</a></li>
                        <li>Get your API Key and Secret</li>
                        <li>Add them to the settings</li>
                    </ol>
                    <p style="margin-top: 20px;">For now, Last.fm scrobbling will remain disabled.</p>
                    <button onclick="window.close()" style="background: #4ecdc4; color: #0f0f0f; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px;">OK</button>
                </body>
            </html>
        `);
        
        credentialsWindow.once('ready-to-show', () => credentialsWindow.show());
    }

    refreshMenu() {
        this.createCustomMenu();
        console.log('🔄 Menu refreshed with updated settings');
    }
}

module.exports = MenuManager;
