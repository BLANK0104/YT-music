const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Media controls
    playPause: () => ipcRenderer.invoke('media-play-pause'),
    nextTrack: () => ipcRenderer.invoke('media-next'),
    previousTrack: () => ipcRenderer.invoke('media-previous'),
    
    // App controls
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    
    // Navigation
    goHome: () => ipcRenderer.invoke('navigate-home'),
    goToLibrary: () => ipcRenderer.invoke('navigate-library'),
    
    // Settings
    getSetting: (key, defaultValue) => ipcRenderer.invoke('get-setting', key, defaultValue),
    setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
    
    // Theme and effects
    setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
    getTheme: () => ipcRenderer.invoke('get-theme')
});

// Basic YouTube Music integration functions
contextBridge.exposeInMainWorld('ytMusic', {
    // Step 1: Basic CSS-only ad removal (safe, non-intrusive)
    removeAds: () => {
        console.log('🛡️ Running basic CSS ad removal...');
        
        // Basic ad selectors that are safe to remove
        const basicAdSelectors = [
            // Premium upsell banners
            'ytmusic-premium-upsell-banner',
            '.ytmusic-premium-upsell-banner',
            '.ytmusic-banner-promo-renderer',
            'ytmusic-notification-action-renderer[aria-label*="Premium"]',
            'ytmusic-notification-action-renderer[aria-label*="Upgrade"]',
            
            // Visual ad containers (not affecting playback)
            '.advertisement-shelf-renderer',
            '.ytmusic-popup-container[popup-type*="PREMIUM"]',
            '[aria-label*="Get YouTube Premium"]',
            '[aria-label*="Try Premium"]',
            '[aria-label*="Upgrade to Premium"]'
        ];
        
        let removedCount = 0;
        basicAdSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el && el.parentNode) {
                        el.style.display = 'none !important';
                        removedCount++;
                    }
                });
            } catch (e) {
                // Silently continue if selector fails
            }
        });
        
        if (removedCount > 0) {
            console.log(`🚫 Removed ${removedCount} ad elements (CSS-only)`);
        }
    },
    // Enhanced current track info with comprehensive metadata
    getCurrentTrack: () => {
        try {
            const titleElement = document.querySelector('.title.ytmusic-player-bar, .yt-formatted-string[role="text"]:nth-of-type(1)');
            const artistElement = document.querySelector('.byline.ytmusic-player-bar a, .yt-formatted-string[role="text"]:nth-of-type(2)');
            const albumElement = document.querySelector('.byline.ytmusic-player-bar .yt-formatted-string:last-child');
            const thumbnailElement = document.querySelector('.ytmusic-player-bar img, .image.ytmusic-player-bar img');
            const durationElement = document.querySelector('.time-info.ytmusic-player-bar .duration, .time-info .duration');
            const currentTimeElement = document.querySelector('.time-info.ytmusic-player-bar .current-time, .time-info .current-time');
            
            return {
                title: titleElement?.textContent?.trim() || '',
                artist: artistElement?.textContent?.trim() || '',
                album: albumElement?.textContent?.trim() || '',
                thumbnail: thumbnailElement?.src || '',
                duration: durationElement?.textContent?.trim() || '',
                currentTime: currentTimeElement?.textContent?.trim() || '',
                isPlaying: !!document.querySelector('#play-pause-button[aria-label*="Pause"]')
            };
        } catch (error) {
            console.error('Error getting current track:', error);
            return null;
        }
    },

    // Enhanced media controls with better selectors
    play: () => {
        const playButton = document.querySelector('#play-pause-button[aria-label*="Play"], .play-pause-button[aria-label*="Play"]');
        if (playButton) {
            playButton.click();
            console.log('🎵 Play clicked');
            return true;
        }
        console.warn('Play button not found');
        return false;
    },

    pause: () => {
        const pauseButton = document.querySelector('#play-pause-button[aria-label*="Pause"], .play-pause-button[aria-label*="Pause"]');
        if (pauseButton) {
            pauseButton.click();
            console.log('⏸️ Pause clicked');
            return true;
        }
        console.warn('Pause button not found');
        return false;
    },

    next: () => {
        const nextButton = document.querySelector('.next-button.ytmusic-player-bar, #next-button, [aria-label*="Next"]');
        if (nextButton) {
            nextButton.click();
            console.log('⏭️ Next clicked');
            return true;
        }
        console.warn('Next button not found');
        return false;
    },

    previous: () => {
        const prevButton = document.querySelector('.previous-button.ytmusic-player-bar, #previous-button, [aria-label*="Previous"]');
        if (prevButton) {
            prevButton.click();
            console.log('⏮️ Previous clicked');
            return true;
        }
        console.warn('Previous button not found');
        return false;
    },

    setVolume: (volume) => {
        try {
            const volumeSlider = document.querySelector('#volume-slider input[type="range"], .volume-slider input[type="range"]');
            if (volumeSlider) {
                volumeSlider.value = volume;
                volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
                volumeSlider.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`🔊 Volume set to ${volume}`);
                return true;
            }
        } catch (error) {
            console.error('Error setting volume:', error);
        }
        return false;
    },

    getVolume: () => {
        const volumeSlider = document.querySelector('#volume-slider input[type="range"], .volume-slider input[type="range"]');
        return volumeSlider ? parseInt(volumeSlider.value) : 50;
    },

    toggleShuffle: () => {
        const shuffleButton = document.querySelector('.shuffle.ytmusic-player-bar, #shuffle-button, [aria-label*="Shuffle"]');
        if (shuffleButton) {
            shuffleButton.click();
            console.log('🔀 Shuffle toggled');
            return true;
        }
        return false;
    },

    toggleRepeat: () => {
        const repeatButton = document.querySelector('.repeat.ytmusic-player-bar, #repeat-button, [aria-label*="Repeat"]');
        if (repeatButton) {
            repeatButton.click();
            console.log('🔁 Repeat toggled');
            return true;
        }
        return false;
    },

    search: (query) => {
        try {
            const searchBox = document.querySelector('ytmusic-search-box input, #search-input, [placeholder*="Search"]');
            if (searchBox) {
                searchBox.value = query;
                searchBox.dispatchEvent(new Event('input', { bubbles: true }));
                // Trigger search
                const searchButton = document.querySelector('ytmusic-search-box button, #search-button');
                if (searchButton) {
                    searchButton.click();
                }
                console.log(`🔍 Searched for: ${query}`);
                return true;
            }
        } catch (error) {
            console.error('Error performing search:', error);
        }
        return false;
    },

    getPlayerState: () => {
        try {
            const video = document.querySelector('video');
            if (video) {
                return {
                    currentTime: video.currentTime,
                    duration: video.duration,
                    paused: video.paused,
                    volume: video.volume,
                    muted: video.muted,
                    playbackRate: video.playbackRate
                };
            }
        } catch (error) {
            console.error('Error getting player state:', error);
        }
        return null;
    },

    // Navigation helpers
    navigateToHome: () => {
        const homeButton = document.querySelector('a[href="/"], ytmusic-pivot-bar-item-renderer[tab-identifier="FEmusic_home"]');
        if (homeButton) {
            homeButton.click();
            return true;
        }
        return false;
    },

    navigateToLibrary: () => {
        const libraryButton = document.querySelector('a[href*="library"], ytmusic-pivot-bar-item-renderer[tab-identifier*="library"]');
        if (libraryButton) {
            libraryButton.click();
            return true;
        }
        return false;
    },

    navigateToExplore: () => {
        const exploreButton = document.querySelector('a[href*="explore"], ytmusic-pivot-bar-item-renderer[tab-identifier*="explore"]');
        if (exploreButton) {
            exploreButton.click();
            return true;
        }
        return false;
    }
});

// Basic YouTube Music initialization
window.addEventListener('DOMContentLoaded', () => {
    console.log('🎵 YouTube Music Desktop App initialized');
    
    // Run initial ad removal after page loads
    setTimeout(() => {
        if (window.ytMusic && window.ytMusic.removeAds) {
            window.ytMusic.removeAds();
        }
    }, 2000);
    
    // Run basic ad removal every 30 seconds (gentle approach)
    setInterval(() => {
        if (window.ytMusic && window.ytMusic.removeAds) {
            window.ytMusic.removeAds();
        }
    }, 30000);
});
