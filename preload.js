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

// YouTube Music integration functions
contextBridge.exposeInMainWorld('ytMusic', {
    // Enhanced ad blocking with more aggressive detection
    removeAds: () => {
        const removeElements = (selectors) => {
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el) {
                        el.style.display = 'none';
                        el.style.visibility = 'hidden';
                        el.style.opacity = '0';
                        el.style.height = '0';
                        el.style.width = '0';
                        el.style.overflow = 'hidden';
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
            '.ytmusic-interruption-modal',
            '[aria-label*="Get YouTube Premium"]',
            '[aria-label*="Try Premium"]',
            '.compact-media-item-renderer[data-context-menu-name="ads"]',
            '.ytmusic-banner-promo-renderer',
            '.ytmusic-pivot-bar-item-renderer[aria-label*="Premium"]'
        ];

        removeElements(adSelectors);

        // Remove ads by checking text content
        const elementsWithText = document.querySelectorAll('*');
        elementsWithText.forEach(el => {
            const text = el.textContent?.toLowerCase() || '';
            if (text.includes('advertisement') || 
                text.includes('sponsored') || 
                text.includes('try premium') ||
                text.includes('get youtube premium')) {
                if (el.tagName !== 'BODY' && el.tagName !== 'HTML') {
                    el.style.display = 'none';
                }
            }
        });
    },

    // Enhanced current track info with more metadata
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
            return true;
        }
        return false;
    },

    pause: () => {
        const pauseButton = document.querySelector('#play-pause-button[aria-label*="Pause"], .play-pause-button[aria-label*="Pause"]');
        if (pauseButton) {
            pauseButton.click();
            return true;
        }
        return false;
    },

    next: () => {
        const nextButton = document.querySelector('.next-button, [aria-label*="Next"], [title*="Next"]');
        if (nextButton) {
            nextButton.click();
            return true;
        }
        return false;
    },

    previous: () => {
        const prevButton = document.querySelector('.previous-button, [aria-label*="Previous"], [title*="Previous"]');
        if (prevButton) {
            prevButton.click();
            return true;
        }
        return false;
    },

    // Enhanced volume control with validation
    setVolume: (volume) => {
        volume = Math.max(0, Math.min(100, volume)); // Clamp between 0-100
        const volumeSlider = document.querySelector('#volume-slider input[type="range"], .volume-slider input[type="range"]');
        if (volumeSlider) {
            volumeSlider.value = volume;
            volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
            volumeSlider.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
        return false;
    },

    getVolume: () => {
        const volumeSlider = document.querySelector('#volume-slider input[type="range"], .volume-slider input[type="range"]');
        return volumeSlider ? parseInt(volumeSlider.value) : 50;
    },

    // Toggle controls
    toggleShuffle: () => {
        const shuffleButton = document.querySelector('[aria-label*="Shuffle"], .shuffle-button');
        if (shuffleButton) {
            shuffleButton.click();
            return true;
        }
        return false;
    },

    toggleRepeat: () => {
        const repeatButton = document.querySelector('[aria-label*="Repeat"], .repeat-button');
        if (repeatButton) {
            repeatButton.click();
            return true;
        }
        return false;
    },

    // Search functionality
    search: (query) => {
        const searchInput = document.querySelector('input[placeholder*="Search"], #search-input');
        if (searchInput && query) {
            searchInput.value = query;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            return true;
        }
        return false;
    },

    // Get player state
    getPlayerState: () => {
        try {
            const playButton = document.querySelector('#play-pause-button, .play-pause-button');
            const shuffleButton = document.querySelector('[aria-label*="Shuffle"]');
            const repeatButton = document.querySelector('[aria-label*="Repeat"]');
            
            return {
                isPlaying: playButton?.getAttribute('aria-label')?.includes('Pause') || false,
                isShuffled: shuffleButton?.getAttribute('aria-label')?.includes('On') || false,
                repeatMode: repeatButton?.getAttribute('aria-label') || 'off',
                volume: window.ytMusic.getVolume(),
                currentTrack: window.ytMusic.getCurrentTrack()
            };
        } catch (error) {
            console.error('Error getting player state:', error);
            return null;
        }
    },

    // Navigate to different sections
    navigateToHome: () => {
        const homeLink = document.querySelector('a[href="/"], [aria-label*="Home"]');
        if (homeLink) {
            homeLink.click();
            return true;
        }
        return false;
    },

    navigateToLibrary: () => {
        const libraryLink = document.querySelector('a[href*="library"], [aria-label*="Library"]');
        if (libraryLink) {
            libraryLink.click();
            return true;
        }
        return false;
    },

    navigateToExplore: () => {
        const exploreLink = document.querySelector('a[href*="explore"], [aria-label*="Explore"]');
        if (exploreLink) {
            exploreLink.click();
            return true;
        }
        return false;
    }
});

// Enhanced DOM content loading and ad removal
document.addEventListener('DOMContentLoaded', () => {
    if (window.ytMusic) {
        // Initial ad removal
        window.ytMusic.removeAds();
        
        // Set up enhanced mutation observer for dynamic content
        const observer = new MutationObserver((mutations) => {
            let shouldRemoveAds = false;
            let shouldUpdateTrackInfo = false;
            
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    // Check if any added nodes are potential ads
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            const element = node;
                            const className = element.className || '';
                            const textContent = element.textContent || '';
                            
                            // Check for ad-related content
                            if (className.includes('ad') || 
                                className.includes('premium') ||
                                textContent.toLowerCase().includes('advertisement') ||
                                textContent.toLowerCase().includes('sponsored')) {
                                shouldRemoveAds = true;
                            }
                            
                            // Check for player updates
                            if (className.includes('player') || 
                                className.includes('track') ||
                                element.querySelector('.ytmusic-player-bar')) {
                                shouldUpdateTrackInfo = true;
                            }
                        }
                    });
                }
                
                // Check attribute changes for player state
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'aria-label' || 
                     mutation.attributeName === 'title')) {
                    shouldUpdateTrackInfo = true;
                }
            });
            
            if (shouldRemoveAds) {
                setTimeout(() => window.ytMusic.removeAds(), 100);
            }
            
            if (shouldUpdateTrackInfo) {
                // Notify main process about track changes (could be used for notifications)
                setTimeout(() => {
                    const trackInfo = window.ytMusic.getCurrentTrack();
                    if (trackInfo && trackInfo.title) {
                        console.log('Track changed:', trackInfo);
                    }
                }, 200);
            }
        });

        // Start observing with comprehensive options
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'aria-label', 'title', 'src'],
            characterData: true
        });

        // Periodic ad removal as backup
        setInterval(() => {
            window.ytMusic.removeAds();
        }, 5000);

        // Add keyboard shortcuts for better user experience
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key) {
                case ' ':
                    if (e.ctrlKey || e.metaKey) break; // Don't interfere with browser shortcuts
                    e.preventDefault();
                    const playButton = document.querySelector('#play-pause-button');
                    if (playButton) playButton.click();
                    break;
                    
                case 'ArrowRight':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        window.ytMusic.next();
                    }
                    break;
                    
                case 'ArrowLeft':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        window.ytMusic.previous();
                    }
                    break;
                    
                case 'ArrowUp':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const currentVolume = window.ytMusic.getVolume();
                        window.ytMusic.setVolume(Math.min(100, currentVolume + 5));
                    }
                    break;
                    
                case 'ArrowDown':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const currentVolume = window.ytMusic.getVolume();
                        window.ytMusic.setVolume(Math.max(0, currentVolume - 5));
                    }
                    break;
            }
        });

        console.log('YouTube Music Desktop - Enhanced features loaded');
    }
});

// Additional initialization when page is fully loaded
window.addEventListener('load', () => {
    // Force remove any remaining ads after full page load
    setTimeout(() => {
        if (window.ytMusic) {
            window.ytMusic.removeAds();
        }
    }, 1000);
    
    // Add visual enhancements
    setTimeout(() => {
        // Add custom styles for better integration
        const customStyle = document.createElement('style');
        customStyle.textContent = `
            /* Smooth transitions for all interactive elements */
            button, a, .clickable {
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            
            /* Enhanced focus states */
            button:focus, a:focus {
                outline: 2px solid #4ecdc4 !important;
                outline-offset: 2px !important;
            }
            
            /* Subtle glow for active elements */
            .ytmusic-player-bar button:hover {
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.2) !important;
            }
        `;
        document.head.appendChild(customStyle);
    }, 2000);
});
