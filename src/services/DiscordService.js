/**
 * Discord Rich Presence Service
 */

const appState = require('../utils/state');
const { loadOptionalDependency } = require('../utils/dependencies');

class DiscordService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.currentActivity = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryTimeout = null;
    }

    async initialize() {
        try {
            const DiscordRPC = await loadOptionalDependency('discord-rpc', 'Discord RPC');
            if (!DiscordRPC) {
                console.warn('⚠️ Discord RPC not available - install with: npm install discord-rpc');
                return false;
            }

            this.client = new DiscordRPC.Client({ transport: 'ipc' });

            this.client.on('ready', () => {
                console.log('🎮 Discord RPC connected successfully');
                this.isConnected = true;
                this.retryCount = 0;
                
                // Update activity if we have current track info
                const currentTrack = appState.getCurrentTrack();
                if (currentTrack && currentTrack.title) {
                    this.updateActivity(currentTrack);
                }
            });

            this.client.on('disconnected', () => {
                console.log('🎮 Discord RPC disconnected');
                this.isConnected = false;
                this.attemptReconnect();
            });

            await this.client.login({ clientId: '1234567890123456789' }); // Replace with actual client ID
            return true;

        } catch (error) {
            console.error('Failed to initialize Discord RPC:', error);
            this.attemptReconnect();
            return false;
        }
    }

    updateActivity(trackInfo) {
        if (!this.client || !this.isConnected) {
            console.log('🎮 Discord RPC not connected - cannot update activity');
            return;
        }

        try {
            const activity = {
                details: trackInfo.title || 'Unknown Track',
                state: trackInfo.artist || 'Unknown Artist',
                largeImageKey: 'ytmusic_logo',
                largeImageText: 'YouTube Music',
                smallImageKey: trackInfo.isPlaying ? 'play' : 'pause',
                smallImageText: trackInfo.isPlaying ? 'Playing' : 'Paused',
                instance: false,
            };

            // Add album info if available
            if (trackInfo.album) {
                activity.state += ` • ${trackInfo.album}`;
            }

            // Add timestamps if playing
            if (trackInfo.isPlaying && trackInfo.duration && trackInfo.currentTime) {
                const remaining = trackInfo.duration - trackInfo.currentTime;
                activity.endTimestamp = Date.now() + (remaining * 1000);
            }

            this.client.setActivity(activity);
            this.currentActivity = activity;
            
            console.log('🎮 Updated Discord activity:', {
                track: trackInfo.title,
                artist: trackInfo.artist,
                playing: trackInfo.isPlaying
            });

        } catch (error) {
            console.error('Failed to update Discord activity:', error);
        }
    }

    clearActivity() {
        if (!this.client || !this.isConnected) return;

        try {
            this.client.clearActivity();
            this.currentActivity = null;
            console.log('🎮 Cleared Discord activity');
        } catch (error) {
            console.error('Failed to clear Discord activity:', error);
        }
    }

    attemptReconnect() {
        if (this.retryCount >= this.maxRetries) {
            console.log('🎮 Max Discord RPC reconnection attempts reached');
            return;
        }

        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
        }

        const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
        this.retryCount++;

        console.log(`🎮 Attempting Discord RPC reconnection in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);

        this.retryTimeout = setTimeout(async () => {
            try {
                await this.initialize();
            } catch (error) {
                console.error('Discord RPC reconnection failed:', error);
                this.attemptReconnect();
            }
        }, delay);
    }

    async disconnect() {
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
            this.retryTimeout = null;
        }

        if (this.client) {
            try {
                await this.client.destroy();
                console.log('🎮 Discord RPC disconnected gracefully');
            } catch (error) {
                console.error('Error disconnecting Discord RPC:', error);
            }
        }

        this.client = null;
        this.isConnected = false;
        this.currentActivity = null;
        this.retryCount = 0;
    }

    isEnabled() {
        return appState.getSettings().discordRPC;
    }

    async setEnabled(enabled) {
        const settings = appState.getSettings();
        settings.discordRPC = enabled;
        appState.setSettings(settings);

        if (enabled && !this.isConnected) {
            await this.initialize();
        } else if (!enabled && this.isConnected) {
            await this.disconnect();
        }

        console.log(`🎮 Discord RPC ${enabled ? 'enabled' : 'disabled'}`);
    }

    getStatus() {
        return {
            connected: this.isConnected,
            enabled: this.isEnabled(),
            currentActivity: this.currentActivity,
            retryCount: this.retryCount
        };
    }
}

module.exports = DiscordService;
