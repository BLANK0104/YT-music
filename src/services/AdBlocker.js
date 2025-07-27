/**
 * Ad Blocking Service
 */

const { session } = require('electron');
const { appConstants } = require('../utils/constants');

class AdBlocker {
    constructor() {
        this.isSetup = false;
    }

    setup() {
        if (this.isSetup) {
            return;
        }

        console.log('🛡️ Setting up proven network-level ad blocking...');
        
        // Network-level ad request blocking
        session.defaultSession.webRequest.onBeforeRequest({
            urls: appConstants.AD_BLOCKING_PATTERNS
        }, (details, callback) => {
            const url = details.url.toLowerCase();
            
            // Never block essential requests
            const isEssential = appConstants.ESSENTIAL_PATTERNS.some(pattern => url.includes(pattern));
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

        this.isSetup = true;
        console.log('✅ Proven network-level ad blocking activated');
    }

    disable() {
        // Note: Electron doesn't provide a way to remove webRequest listeners
        // This would require app restart to fully disable
        console.log('ℹ️ Ad blocking requires app restart to disable');
    }

    getBlockedRequestsCount() {
        // This would require implementing a counter
        // For now, return a placeholder
        return 0;
    }

    isActive() {
        return this.isSetup;
    }
}

module.exports = AdBlocker;
