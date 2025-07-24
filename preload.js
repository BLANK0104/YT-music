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
    
    // Ad blocking status
    getAdBlockingStatus: () => ipcRenderer.invoke('get-ad-blocking-status'),
    
    // Theme
    setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
    getTheme: () => ipcRenderer.invoke('get-theme')
});

// YouTube Music integration functions
contextBridge.exposeInMainWorld('ytMusic', {
    // Enhanced ad blocking
    removeAds: () => {
        // Additional client-side ad removal
        const removeElements = (selectors) => {
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el) {
                        el.style.display = 'none';
                        el.remove();
                    }
                });
            });
        };

        const adSelectors = [
            '.ytmusic-popup-container',
            '.advertisement-shelf-renderer',
            '.masthead-ad-control',
            '.video-ads',
            '.ytp-ad-module',
            '.ytp-ad-overlay-container',
            '.ytp-ad-text-overlay',
            '.ytp-ad-player-overlay',
            'ytmusic-premium-upsell-banner',
            '.ytmusic-premium-upsell-banner',
            '[class*="premium-upsell"]',
            '[class*="advertisement"]',
            '[id*="google_ads"]',
            '[class*="google_ads"]',
            '.ytmusic-you-there-renderer',
            '.ytmusic-interruption-modal'
        ];

        removeElements(adSelectors);
    },

    // Get current playing track info
    getCurrentTrack: () => {
        try {
            const titleElement = document.querySelector('.title.ytmusic-player-bar');
            const artistElement = document.querySelector('.byline.ytmusic-player-bar a');
            const albumElement = document.querySelector('.byline.ytmusic-player-bar .yt-formatted-string:last-child');
            
            return {
                title: titleElement?.textContent || '',
                artist: artistElement?.textContent || '',
                album: albumElement?.textContent || ''
            };
        } catch (error) {
            console.error('Error getting current track:', error);
            return null;
        }
    },

    // Media controls
    play: () => {
        const playButton = document.querySelector('#play-pause-button');
        if (playButton && playButton.getAttribute('aria-label')?.includes('Play')) {
            playButton.click();
        }
    },

    pause: () => {
        const pauseButton = document.querySelector('#play-pause-button');
        if (pauseButton && pauseButton.getAttribute('aria-label')?.includes('Pause')) {
            pauseButton.click();
        }
    },

    next: () => {
        const nextButton = document.querySelector('.next-button');
        if (nextButton) {
            nextButton.click();
        }
    },

    previous: () => {
        const prevButton = document.querySelector('.previous-button');
        if (prevButton) {
            prevButton.click();
        }
    },

    // Volume control
    setVolume: (volume) => {
        const volumeSlider = document.querySelector('#volume-slider input[type="range"]');
        if (volumeSlider) {
            volumeSlider.value = volume;
            volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
        }
    },

    getVolume: () => {
        const volumeSlider = document.querySelector('#volume-slider input[type="range"]');
        return volumeSlider ? parseInt(volumeSlider.value) : 50;
    },

    // Shuffle and repeat
    toggleShuffle: () => {
        const shuffleButton = document.querySelector('[aria-label*="Shuffle"]');
        if (shuffleButton) {
            shuffleButton.click();
        }
    },

    toggleRepeat: () => {
        const repeatButton = document.querySelector('[aria-label*="Repeat"]');
        if (repeatButton) {
            repeatButton.click();
        }
    }
});

// Run ad removal when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.ytMusic) {
        window.ytMusic.removeAds();
        
        // Set up mutation observer to remove ads dynamically
        const observer = new MutationObserver((mutations) => {
            let shouldRemoveAds = false;
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    shouldRemoveAds = true;
                }
            });
            
            if (shouldRemoveAds) {
                setTimeout(() => window.ytMusic.removeAds(), 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
});
