/**
 * Last.fm Scrobbling Service
 */

const appState = require('../utils/state');
const { loadOptionalDependency } = require('../utils/dependencies');

class LastfmService {
    constructor() {
        this.client = null;
        this.isAuthenticated = false;
        this.sessionKey = null;
        this.scrobbleQueue = [];
        this.currentTrack = null;
        this.scrobbleTimeout = null;
    }

    async initialize() {
        try {
            const LastfmAPI = await loadOptionalDependency('lastfm', 'Last.fm API');
            if (!LastfmAPI) {
                console.warn('⚠️ Last.fm API not available - install with: npm install lastfm');
                return false;
            }

            this.client = new LastfmAPI({
                api_key: 'your_lastfm_api_key',    // Replace with actual API key
                secret: 'your_lastfm_secret',      // Replace with actual secret
                useragent: 'YouTube Music Desktop/1.0.0'
            });

            // Try to restore session from settings
            const settings = appState.getSettings();
            if (settings.lastfm && settings.lastfm.sessionKey) {
                this.sessionKey = settings.lastfm.sessionKey;
                this.isAuthenticated = true;
                console.log('📻 Last.fm session restored from settings');
            }

            return true;

        } catch (error) {
            console.error('Failed to initialize Last.fm service:', error);
            return false;
        }
    }

    async authenticate(username, password) {
        if (!this.client) {
            console.error('Last.fm client not initialized');
            return false;
        }

        try {
            // Get authentication token
            const authResult = await new Promise((resolve, reject) => {
                this.client.authenticate(username, password, (err, session) => {
                    if (err) reject(err);
                    else resolve(session);
                });
            });

            this.sessionKey = authResult.key;
            this.isAuthenticated = true;

            // Save session to settings
            const settings = appState.getSettings();
            settings.lastfm = {
                ...settings.lastfm,
                sessionKey: this.sessionKey,
                username: authResult.name
            };
            appState.setSettings(settings);

            console.log(`📻 Last.fm authenticated successfully for user: ${authResult.name}`);
            return true;

        } catch (error) {
            console.error('Last.fm authentication failed:', error);
            this.isAuthenticated = false;
            this.sessionKey = null;
            return false;
        }
    }

    async scrobbleTrack(trackInfo) {
        if (!this.isEnabled() || !this.isAuthenticated || !this.client) {
            return;
        }

        try {
            const scrobbleData = {
                artist: trackInfo.artist,
                track: trackInfo.title,
                timestamp: Math.floor(Date.now() / 1000),
                album: trackInfo.album || '',
                duration: trackInfo.duration || 0
            };

            // Add to queue for batch processing
            this.scrobbleQueue.push(scrobbleData);

            // Process queue
            await this.processScrobbleQueue();

            console.log('📻 Scrobbled to Last.fm:', {
                track: trackInfo.title,
                artist: trackInfo.artist
            });

        } catch (error) {
            console.error('Failed to scrobble track:', error);
        }
    }

    async processScrobbleQueue() {
        if (this.scrobbleQueue.length === 0) return;

        try {
            const batch = this.scrobbleQueue.splice(0, 50); // Process up to 50 at once

            await new Promise((resolve, reject) => {
                this.client.scrobble(batch, this.sessionKey, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            console.log(`📻 Successfully scrobbled ${batch.length} tracks to Last.fm`);

        } catch (error) {
            console.error('Failed to process scrobble queue:', error);
            // Re-add failed items to queue
            this.scrobbleQueue.unshift(...error.failedItems || []);
        }
    }

    async updateNowPlaying(trackInfo) {
        if (!this.isEnabled() || !this.isAuthenticated || !this.client) {
            return;
        }

        try {
            const nowPlayingData = {
                artist: trackInfo.artist,
                track: trackInfo.title,
                album: trackInfo.album || '',
                duration: trackInfo.duration || 0
            };

            await new Promise((resolve, reject) => {
                this.client.nowPlaying(nowPlayingData, this.sessionKey, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            this.currentTrack = trackInfo;
            
            // Schedule scrobble when track is half played or 4 minutes, whichever comes first
            this.scheduleScrobble(trackInfo);

            console.log('📻 Updated Now Playing on Last.fm:', {
                track: trackInfo.title,
                artist: trackInfo.artist
            });

        } catch (error) {
            console.error('Failed to update now playing:', error);
        }
    }

    scheduleScrobble(trackInfo) {
        // Clear existing timeout
        if (this.scrobbleTimeout) {
            clearTimeout(this.scrobbleTimeout);
        }

        const duration = trackInfo.duration || 240; // Default 4 minutes
        const scrobbleTime = Math.min(duration / 2, 240) * 1000; // Half duration or 4 minutes

        this.scrobbleTimeout = setTimeout(() => {
            this.scrobbleTrack(trackInfo);
        }, scrobbleTime);
    }

    async getLoveStatus(trackInfo) {
        if (!this.isAuthenticated || !this.client) {
            return false;
        }

        try {
            const result = await new Promise((resolve, reject) => {
                this.client.getTrackInfo({
                    artist: trackInfo.artist,
                    track: trackInfo.title
                }, this.sessionKey, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });

            return result.track && result.track.userloved === '1';

        } catch (error) {
            console.error('Failed to get love status:', error);
            return false;
        }
    }

    async loveTrack(trackInfo) {
        if (!this.isAuthenticated || !this.client) {
            return false;
        }

        try {
            await new Promise((resolve, reject) => {
                this.client.loveTrack({
                    artist: trackInfo.artist,
                    track: trackInfo.title
                }, this.sessionKey, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            console.log('❤️ Loved track on Last.fm:', {
                track: trackInfo.title,
                artist: trackInfo.artist
            });

            return true;

        } catch (error) {
            console.error('Failed to love track:', error);
            return false;
        }
    }

    async unloveTrack(trackInfo) {
        if (!this.isAuthenticated || !this.client) {
            return false;
        }

        try {
            await new Promise((resolve, reject) => {
                this.client.unloveTrack({
                    artist: trackInfo.artist,
                    track: trackInfo.title
                }, this.sessionKey, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            console.log('💔 Unloved track on Last.fm:', {
                track: trackInfo.title,
                artist: trackInfo.artist
            });

            return true;

        } catch (error) {
            console.error('Failed to unlove track:', error);
            return false;
        }
    }

    disconnect() {
        this.isAuthenticated = false;
        this.sessionKey = null;
        this.currentTrack = null;

        if (this.scrobbleTimeout) {
            clearTimeout(this.scrobbleTimeout);
            this.scrobbleTimeout = null;
        }

        // Clear session from settings
        const settings = appState.getSettings();
        if (settings.lastfm) {
            delete settings.lastfm.sessionKey;
            delete settings.lastfm.username;
            appState.setSettings(settings);
        }

        console.log('📻 Last.fm disconnected');
    }

    isEnabled() {
        return appState.getSettings().lastfm?.enabled || false;
    }

    setEnabled(enabled) {
        const settings = appState.getSettings();
        settings.lastfm = {
            ...settings.lastfm,
            enabled: enabled
        };
        appState.setSettings(settings);

        if (!enabled && this.scrobbleTimeout) {
            clearTimeout(this.scrobbleTimeout);
            this.scrobbleTimeout = null;
        }

        console.log(`📻 Last.fm scrobbling ${enabled ? 'enabled' : 'disabled'}`);
    }

    getStatus() {
        const settings = appState.getSettings();
        return {
            enabled: this.isEnabled(),
            authenticated: this.isAuthenticated,
            username: settings.lastfm?.username,
            queueLength: this.scrobbleQueue.length,
            currentTrack: this.currentTrack
        };
    }
}

module.exports = LastfmService;
