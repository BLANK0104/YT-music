/**
 * Application State Management
 */

const Store = require('electron-store');
const { defaultSettings } = require('./constants');

class AppState {
    constructor() {
        this.store = new Store();
        this.windows = {
            main: null,
            settings: null,
            miniPlayer: null
        };
        this.tray = null;
        this.isQuiting = false;
        this.powerSaveId = null;
        this.currentTrack = {};
        this.discordClient = null;
        this.lastfmSession = null;
        this.audioContext = null;
        this.equalizerNode = null;
    }

    // Window management
    setMainWindow(window) {
        this.windows.main = window;
    }

    getMainWindow() {
        return this.windows.main;
    }

    setSettingsWindow(window) {
        this.windows.settings = window;
    }

    getSettingsWindow() {
        return this.windows.settings;
    }

    setMiniPlayerWindow(window) {
        this.windows.miniPlayer = window;
    }

    getMiniPlayerWindow() {
        return this.windows.miniPlayer;
    }

    // Settings management
    getSettings() {
        return { ...defaultSettings, ...this.store.get('settings', {}) };
    }

    getSetting(key, defaultValue = null) {
        const settings = this.getSettings();
        return settings[key] ?? defaultValue;
    }

    setSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        this.store.set('settings', settings);
    }

    saveSettings(newSettings) {
        const currentSettings = this.getSettings();
        const mergedSettings = { ...currentSettings, ...newSettings };
        this.store.set('settings', mergedSettings);
        return true;
    }

    // Window bounds management
    getWindowBounds() {
        return this.store.get('windowBounds', { width: 1400, height: 900 });
    }

    setWindowBounds(bounds) {
        this.store.set('windowBounds', bounds);
    }

    // Tray management
    setTray(tray) {
        this.tray = tray;
    }

    getTray() {
        return this.tray;
    }

    // Quit state
    setQuiting(isQuiting) {
        this.isQuiting = isQuiting;
    }

    isAppQuiting() {
        return this.isQuiting;
    }

    // Power save management
    setPowerSaveId(id) {
        this.powerSaveId = id;
    }

    getPowerSaveId() {
        return this.powerSaveId;
    }

    // Track information
    setCurrentTrack(track) {
        this.currentTrack = track;
    }

    getCurrentTrack() {
        return this.currentTrack;
    }

    // Discord client
    setDiscordClient(client) {
        this.discordClient = client;
    }

    getDiscordClient() {
        return this.discordClient;
    }

    // Last.fm session
    setLastfmSession(session) {
        this.lastfmSession = session;
    }

    getLastfmSession() {
        return this.lastfmSession;
    }

    // Audio context
    setAudioContext(context) {
        this.audioContext = context;
    }

    getAudioContext() {
        return this.audioContext;
    }

    // Equalizer node
    setEqualizerNode(node) {
        this.equalizerNode = node;
    }

    getEqualizerNode() {
        return this.equalizerNode;
    }

    // Utility methods
    getTrayNotificationShown() {
        return this.store.get('trayNotificationShown', false);
    }

    setTrayNotificationShown(shown) {
        this.store.set('trayNotificationShown', shown);
    }

    getSelectedTheme() {
        return this.store.get('selectedTheme', 'dark');
    }

    setSelectedTheme(theme) {
        this.store.set('selectedTheme', theme);
    }
}

// Export singleton instance
module.exports = new AppState();
