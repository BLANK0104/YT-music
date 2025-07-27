/**
 * IPC (Inter-Process Communication) Handler
 */

const { ipcMain } = require('electron');
const appState = require('../utils/state');
const { appConstants } = require('../utils/constants');

class IPCHandler {
    constructor() {
        this.handlers = new Map();
    }

    setup() {
        this.registerMediaControlHandlers();
        this.registerWindowControlHandlers();
        this.registerNavigationHandlers();
        this.registerSettingsHandlers();
        this.registerTrackInfoHandlers();
        
        console.log('🔗 IPC handlers registered');
    }

    registerMediaControlHandlers() {
        this.registerHandler('media-play-pause', async () => {
            const mainWindow = appState.getMainWindow();
            if (mainWindow) {
                return await mainWindow.webContents.executeJavaScript(`
                    const playPauseBtn = document.querySelector('${appConstants.SELECTORS.PLAY_PAUSE}');
                    if (playPauseBtn) {
                        playPauseBtn.click();
                        return true;
                    }
                    return false;
                `);
            }
            return false;
        });

        this.registerHandler('media-next', async () => {
            const mainWindow = appState.getMainWindow();
            if (mainWindow) {
                return await mainWindow.webContents.executeJavaScript(`
                    const nextBtn = document.querySelector('${appConstants.SELECTORS.NEXT}');
                    if (nextBtn) {
                        nextBtn.click();
                        return true;
                    }
                    return false;
                `);
            }
            return false;
        });

        this.registerHandler('media-previous', async () => {
            const mainWindow = appState.getMainWindow();
            if (mainWindow) {
                return await mainWindow.webContents.executeJavaScript(`
                    const prevBtn = document.querySelector('${appConstants.SELECTORS.PREVIOUS}');
                    if (prevBtn) {
                        prevBtn.click();
                        return true;
                    }
                    return false;
                `);
            }
            return false;
        });
    }

    registerWindowControlHandlers() {
        this.registerHandler('window-minimize', () => {
            const mainWindow = appState.getMainWindow();
            if (mainWindow) mainWindow.minimize();
        });

        this.registerHandler('window-maximize', () => {
            const mainWindow = appState.getMainWindow();
            if (mainWindow) {
                if (mainWindow.isMaximized()) {
                    mainWindow.unmaximize();
                } else {
                    mainWindow.maximize();
                }
            }
        });

        this.registerHandler('window-close', () => {
            const mainWindow = appState.getMainWindow();
            if (mainWindow) mainWindow.close();
        });
    }

    registerNavigationHandlers() {
        this.registerHandler('navigate-home', async () => {
            const mainWindow = appState.getMainWindow();
            if (mainWindow) {
                return await mainWindow.webContents.executeJavaScript(`
                    const homeBtn = document.querySelector('${appConstants.SELECTORS.HOME}');
                    if (homeBtn) {
                        homeBtn.click();
                        return true;
                    } else {
                        window.location.href = '${appConstants.YOUTUBE_MUSIC_URL}/';
                        return true;
                    }
                `);
            }
            return false;
        });

        this.registerHandler('navigate-library', async () => {
            const mainWindow = appState.getMainWindow();
            if (mainWindow) {
                return await mainWindow.webContents.executeJavaScript(`
                    const libraryBtn = document.querySelector('${appConstants.SELECTORS.LIBRARY}');
                    if (libraryBtn) {
                        libraryBtn.click();
                        return true;
                    } else {
                        window.location.href = '${appConstants.YOUTUBE_MUSIC_URL}/library';
                        return true;
                    }
                `);
            }
            return false;
        });

        this.registerHandler('navigate-explore', async () => {
            const mainWindow = appState.getMainWindow();
            if (mainWindow) {
                return await mainWindow.webContents.executeJavaScript(`
                    const exploreBtn = document.querySelector('${appConstants.SELECTORS.EXPLORE}');
                    if (exploreBtn) {
                        exploreBtn.click();
                        return true;
                    } else {
                        window.location.href = '${appConstants.YOUTUBE_MUSIC_URL}/explore';
                        return true;
                    }
                `);
            }
            return false;
        });
    }

    registerSettingsHandlers() {
        this.registerHandler('get-setting', (event, key, defaultValue) => {
            return appState.getSetting(key, defaultValue);
        });

        this.registerHandler('set-setting', (event, key, value) => {
            appState.setSetting(key, value);
            // Apply setting changes immediately
            this.applySettingChange(key, value);
            return true;
        });

        this.registerHandler('get-all-settings', () => {
            return appState.getSettings();
        });

        this.registerHandler('save-settings', (event, newSettings) => {
            appState.saveSettings(newSettings);
            
            // Apply all setting changes
            Object.keys(newSettings).forEach(key => {
                this.applySettingChange(key, newSettings[key]);
            });
            
            return true;
        });
    }

    registerTrackInfoHandlers() {
        this.registerHandler('get-current-track', async () => {
            const mainWindow = appState.getMainWindow();
            if (!mainWindow) return null;

            try {
                const trackInfo = await mainWindow.webContents.executeJavaScript(`
                    (function() {
                        try {
                            // Get track title
                            const titleEl = document.querySelector('.title.style-scope.ytmusic-player-bar, .title.ytmusic-player-bar, ytmusic-player-bar .title');
                            const title = titleEl ? titleEl.textContent.trim() : '';

                            // Get artist
                            const artistEl = document.querySelector('.byline.style-scope.ytmusic-player-bar .yt-simple-endpoint, .byline.ytmusic-player-bar .yt-simple-endpoint, ytmusic-player-bar .byline .yt-simple-endpoint');
                            const artist = artistEl ? artistEl.textContent.trim() : '';

                            // Get album
                            const albumEl = document.querySelector('.byline.style-scope.ytmusic-player-bar .yt-simple-endpoint:last-child, ytmusic-player-bar .byline .yt-simple-endpoint:last-child');
                            const album = albumEl && albumEl.textContent !== artist ? albumEl.textContent.trim() : '';

                            // Get play state
                            const playBtn = document.querySelector('${appConstants.SELECTORS.PLAY_PAUSE}');
                            const isPlaying = playBtn ? playBtn.title.toLowerCase().includes('pause') : false;

                            // Get current time and duration
                            const timeEl = document.querySelector('.time-info.style-scope.ytmusic-player-bar, .time-info.ytmusic-player-bar, ytmusic-player-bar .time-info');
                            const timeInfo = timeEl ? timeEl.textContent.trim() : '';

                            return {
                                title: title || 'Unknown',
                                artist: artist || 'Unknown Artist',
                                album: album || '',
                                isPlaying: isPlaying,
                                timeInfo: timeInfo,
                                timestamp: Date.now()
                            };
                        } catch (error) {
                            console.error('Error getting track info:', error);
                            return null;
                        }
                    })();
                `);

                if (trackInfo && trackInfo.title !== 'Unknown') {
                    appState.setCurrentTrack(trackInfo);
                    return trackInfo;
                }
            } catch (error) {
                console.error('Error executing track info script:', error);
            }

            return null;
        });

        this.registerHandler('show-notification', (event, track) => {
            const settings = appState.getSettings();
            if (!settings.desktopNotifications) return;

            const { Notification } = require('electron');
            const path = require('path');

            const notification = new Notification({
                title: track.title || 'YouTube Music',
                body: track.artist ? `${track.artist}${track.album ? ` • ${track.album}` : ''}` : 'Now playing',
                icon: path.join(__dirname, '../../assets', '512px-Youtube_Music_icon.svg.png'),
                silent: true
            });

            notification.show();
            return true;
        });
    }

    registerHandler(channel, handler) {
        if (this.handlers.has(channel)) {
            console.warn(`IPC handler for '${channel}' already exists, overwriting...`);
        }

        ipcMain.handle(channel, handler);
        this.handlers.set(channel, handler);
        console.log(`📡 Registered IPC handler: ${channel}`);
    }

    applySettingChange(key, value) {
        try {
            switch (key) {
                case 'backgroundPlay':
                    this.handleBackgroundPlayChange(value);
                    break;
                case 'systemTray':
                    this.handleSystemTrayChange(value);
                    break;
                case 'mediaKeys':
                    this.handleMediaKeysChange(value);
                    break;
                case 'startWithWindows':
                    this.handleStartWithWindowsChange(value);
                    break;
                case 'discordRichPresence':
                    this.handleDiscordRPCChange(value);
                    break;
                case 'lastfmScrobbling':
                    this.handleLastfmChange(value);
                    break;
                case 'equalizerEnabled':
                    this.handleEqualizerChange(value);
                    break;
                case 'audioNormalization':
                    this.handleAudioNormalizationChange(value);
                    break;
                case 'crossfade':
                    this.handleCrossfadeChange(value);
                    break;
                case 'gaplessPlayback':
                    this.handleGaplessPlaybackChange(value);
                    break;
                case 'customThemes':
                    this.handleCustomThemesChange(value);
                    break;
                case 'animatedBackground':
                    this.handleAnimatedBackgroundChange(value);
                    break;
                case 'visualizer':
                    this.handleVisualizerChange(value);
                    break;
                case 'miniPlayer':
                    this.handleMiniPlayerChange(value);
                    break;
            }
        } catch (error) {
            console.error('Error applying setting change:', key, error);
        }
    }

    handleBackgroundPlayChange(enabled) {
        const { powerSaveBlocker } = require('electron');
        
        if (enabled) {
            if (!appState.getPowerSaveId()) {
                const powerSaveId = powerSaveBlocker.start('prevent-app-suspension');
                appState.setPowerSaveId(powerSaveId);
                console.log('🔋 Background playback enabled');
            }
        } else {
            const powerSaveId = appState.getPowerSaveId();
            if (powerSaveId) {
                powerSaveBlocker.stop(powerSaveId);
                appState.setPowerSaveId(null);
                console.log('🔋 Background playback disabled');
            }
        }
    }

    handleSystemTrayChange(enabled) {
        const TrayManager = require('../modules/TrayManager');
        const trayManager = new TrayManager();
        
        if (enabled) {
            trayManager.create();
        } else {
            trayManager.destroy();
        }
    }

    handleMediaKeysChange(enabled) {
        const GlobalShortcuts = require('../modules/GlobalShortcuts');
        const globalShortcuts = new GlobalShortcuts();
        
        if (enabled) {
            globalShortcuts.register();
        } else {
            globalShortcuts.unregisterAll();
        }
    }

    handleStartWithWindowsChange(enabled) {
        const { app } = require('electron');
        app.setLoginItemSettings({
            openAtLogin: enabled,
            path: process.execPath,
            args: ['--hidden']
        });
    }

    handleDiscordRPCChange(enabled) {
        const dependencies = require('../utils/dependencies');
        if (!dependencies.isDiscordRPCAvailable()) return;

        const DiscordService = require('./DiscordService');
        const discordService = new DiscordService(dependencies);
        
        if (enabled) {
            discordService.initialize();
        } else {
            discordService.destroy();
        }
    }

    handleLastfmChange(enabled) {
        const dependencies = require('../utils/dependencies');
        if (!dependencies.isLastfmAvailable()) return;

        const LastfmService = require('./LastfmService');
        const lastfmService = new LastfmService(dependencies);
        
        if (enabled) {
            lastfmService.initialize();
        }
    }

    handleEqualizerChange(enabled) {
        const AudioEnhancer = require('../modules/AudioEnhancer');
        const audioEnhancer = new AudioEnhancer();
        
        if (enabled) {
            audioEnhancer.setupEqualizer();
        } else {
            audioEnhancer.disableEqualizer();
        }
    }

    handleAudioNormalizationChange(enabled) {
        const AudioEnhancer = require('../modules/AudioEnhancer');
        const audioEnhancer = new AudioEnhancer();
        audioEnhancer.applyAudioNormalization(enabled);
    }

    handleCrossfadeChange(enabled) {
        const AudioEnhancer = require('../modules/AudioEnhancer');
        const audioEnhancer = new AudioEnhancer();
        audioEnhancer.applyCrossfade(enabled);
    }

    handleGaplessPlaybackChange(enabled) {
        const AudioEnhancer = require('../modules/AudioEnhancer');
        const audioEnhancer = new AudioEnhancer();
        audioEnhancer.applyGaplessPlayback(enabled);
    }

    handleCustomThemesChange(enabled) {
        const ThemeManager = require('../modules/ThemeManager');
        const themeManager = new ThemeManager();
        
        if (enabled) {
            const selectedTheme = appState.getSelectedTheme();
            themeManager.applyCustomTheme(selectedTheme);
        } else {
            themeManager.resetTheme();
        }
    }

    handleAnimatedBackgroundChange(enabled) {
        const mainWindow = appState.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript(`
                if (${enabled}) {
                    document.body.style.animation = 'backgroundShift 20s ease-in-out infinite';
                    console.log('🎨 Animated background enabled');
                } else {
                    document.body.style.animation = 'none';
                    console.log('🎨 Animated background disabled');
                }
            `);
        }
    }

    handleVisualizerChange(enabled) {
        const AudioEnhancer = require('../modules/AudioEnhancer');
        const audioEnhancer = new AudioEnhancer();
        
        if (enabled) {
            audioEnhancer.setupVisualizer();
        } else {
            audioEnhancer.disableVisualizer();
        }
    }

    handleMiniPlayerChange(enabled) {
        const miniPlayerWindow = appState.getMiniPlayerWindow();
        
        if (enabled && !miniPlayerWindow) {
            const MiniPlayerWindow = require('../windows/MiniPlayerWindow');
            const miniPlayer = new MiniPlayerWindow();
            miniPlayer.create();
        } else if (!enabled && miniPlayerWindow) {
            miniPlayerWindow.close();
        }
    }

    getRegisteredHandlers() {
        return Array.from(this.handlers.keys());
    }

    cleanup() {
        this.handlers.clear();
        console.log('🔗 IPC handlers cleaned up');
    }
}

module.exports = IPCHandler;
