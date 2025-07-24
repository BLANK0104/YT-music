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
    // Advanced ad blocking system inspired by th-ch/youtube-music and uBlock Origin
    removeAds: () => {
        console.log('🛡️ Running advanced comprehensive ad removal...');
        
        // Enhanced element removal with multiple hiding techniques
        const removeElements = (selectors) => {
            selectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (el && el.parentNode) {
                            // Multiple removal techniques for resilience
                            el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; width: 0 !important; overflow: hidden !important; position: absolute !important; left: -9999px !important;';
                            el.hidden = true;
                            el.remove();
                            console.log('🚫 Removed ad element:', selector);
                        }
                    });
                } catch (e) {
                    console.log('⚠️ Error removing element:', selector, e);
                }
            });
        };

        // Comprehensive ad selectors - Enhanced with th-ch patterns
        const adSelectors = [
            // Core YouTube Music ad containers
            '.ytmusic-popup-container',
            '.advertisement-shelf-renderer', 
            '.masthead-ad-control',
            '.video-ads',
            '.ytp-ad-module',
            '.ytp-ad-overlay-container',
            '.ytp-ad-text-overlay',
            '.ytp-ad-player-overlay',
            '.ytp-ad-preview-container',
            '.ytp-ad-image-overlay',
            '.ytp-ad-skip-button-container',
            
            // Premium upsell banners and prompts
            'ytmusic-premium-upsell-banner',
            '.ytmusic-premium-upsell-banner',
            '.ytmusic-banner-promo-renderer',
            '.ytmusic-you-there-renderer',
            '.ytmusic-interruption-modal',
            'ytmusic-notification-action-renderer',
            'ytmusic-popup-container[popup-type*="PREMIUM"]',
            
            // Enhanced premium detection patterns
            '[class*="premium-upsell"]',
            '[class*="advertisement"]',
            '[id*="google_ads"]',
            '[class*="google_ads"]',
            '[aria-label*="Get YouTube Premium"]',
            '[aria-label*="Try Premium"]', 
            '[aria-label*="Upgrade to Premium"]',
            '[aria-label*="Go Premium"]',
            '[title*="Premium"]',
            '[title*="Ad-free"]',
            '[data-testid*="premium"]',
            '[data-testid*="upsell"]',
            
            // Video ad elements
            '.ad-showing .html5-video-container',
            '.ad-interrupting .html5-video-container',
            '.ytp-ad-text',
            '.ytp-ad-duration-remaining',
            '.ytp-ad-button-icon',
            '.ytp-ad-visit-advertiser-button',
            '.ytp-ad-info-button',
            
            // Generic ad patterns (enhanced)
            '[class*="ad-"]:not([class*="add"]):not([class*="radio"]):not([class*="head"]):not([class*="badge"]):not([class*="advanced"])',
            '[id*="ad-"]:not([id*="add"]):not([id*="radio"]):not([id*="head"])',
            '[class*="ads-"]:not([class*="heads"]):not([class*="broadcast"])',
            '[id*="ads-"]:not([id*="heads"]):not([id*="broadcast"])',
            '[class*="sponsor"]:not([class*="sponsorship"])',
            '[class*="promo"]:not([class*="promotion-"]):not([class*="promo-tab"])',
            '[data-ad]',
            '[data-ad-slot]',
            '[data-google-av-cxn]',
            '[data-google-av-metadata]',
            
            // Third-party ad containers
            'iframe[src*="doubleclick"]',
            'iframe[src*="googlesyndication"]',
            'iframe[src*="googleadservices"]',
            'iframe[src*="google-analytics"]',
            'iframe[src*="googletagmanager"]',
            
            // Music service specific ads
            '.compact-media-item-renderer[data-context-menu-name="ads"]',
            '.ytmusic-pivot-bar-item-renderer[aria-label*="Premium"]',
            'ytmusic-guide-section-renderer[header*="Premium"]',
            '.ytmusic-nav-bar ytmusic-pivot-bar-item-renderer[tab-identifier="SPunlimited"]',
            
            // Additional premium prompts
            'ytmusic-notification-action-renderer:has([aria-label*="Premium"])',
            'ytmusic-notification-action-renderer:has([aria-label*="Upgrade"])',
            'ytmusic-two-row-item-renderer:has([aria-label*="Premium"])',
            
            // Ad overlay and interstitial patterns
            '[class*="overlay"][class*="ad"]',
            '[class*="interstitial"][class*="ad"]',
            '[class*="modal"][class*="ad"]',
            '[class*="popup"][class*="ad"]'
        ];

        removeElements(adSelectors);

        // Advanced text-based ad detection with improved patterns
        const performTextBasedAdDetection = () => {
            const adKeywords = [
                'try premium', 'get premium', 'upgrade to premium', 'go premium',
                'youtube premium', 'ad-free', 'no ads', 'advertisement',
                'sponsored', 'includes paid promotion', 'learn more',
                'skip ad', 'skip ads', 'you can skip', 'this ad will end',
                'why this ad', 'report this ad', 'stop seeing this ad'
            ];

            const textElements = document.querySelectorAll('*');
            textElements.forEach(element => {
                if (element.children.length === 0) { // Only text nodes
                    const text = element.textContent?.toLowerCase().trim();
                    if (text && adKeywords.some(keyword => text.includes(keyword))) {
                        const container = element.closest('div, section, article, aside, header, main');
                        if (container && !container.hasAttribute('data-ad-blocked')) {
                            container.style.cssText = 'display: none !important;';
                            container.setAttribute('data-ad-blocked', 'true');
                            console.log('🚫 Removed text-based ad:', text);
                        }
                    }
                }
            });
        };

        performTextBasedAdDetection();

        // Enhanced video ad detection and blocking
        const blockVideoAds = () => {
            const video = document.querySelector('video');
            const player = document.querySelector('#movie_player');
            
            if (video && player) {
                // Check for ad classes on player
                const isAdShowing = player.classList.contains('ad-showing') || 
                                  player.classList.contains('ad-interrupting');
                
                if (isAdShowing) {
                    console.log('🚫 Video ad detected, applying countermeasures...');
                    
                    // Speed up ad playback
                    video.playbackRate = 16;
                    video.muted = true;
                    
                    // Try to skip ad immediately
                    const skipButtons = player.querySelectorAll('.ytp-ad-skip-button, .ytp-skip-ad-button, [aria-label*="Skip"]');
                    skipButtons.forEach(btn => {
                        if (btn && !btn.hasAttribute('disabled')) {
                            btn.click();
                            console.log('🚫 Clicked skip button');
                        }
                    });
                }
            }
        };

        blockVideoAds();

        // Enhanced mutation observer for continuous ad blocking
        const setupAdvancedObserver = () => {
            const observer = new MutationObserver((mutations) => {
                let shouldRunAdBlock = false;
                
                mutations.forEach((mutation) => {
                    // Check for new nodes that might be ads
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const element = node;
                                
                                // Check if new element contains ad-related classes or attributes
                                const adIndicators = [
                                    'ad', 'advertisement', 'premium', 'upsell', 'promo',
                                    'sponsor', 'google_ads', 'doubleclick'
                                ];
                                
                                const elementString = element.outerHTML?.toLowerCase() || '';
                                if (adIndicators.some(indicator => elementString.includes(indicator))) {
                                    shouldRunAdBlock = true;
                                }
                            }
                        });
                    }
                    
                    // Check for attribute changes that might indicate ads
                    if (mutation.type === 'attributes') {
                        const target = mutation.target;
                        if (target.nodeType === Node.ELEMENT_NODE) {
                            const classList = target.classList;
                            if (classList.contains('ad-showing') || 
                                classList.contains('ad-interrupting') ||
                                target.hasAttribute('data-ad')) {
                                blockVideoAds();
                            }
                        }
                    }
                });

                if (shouldRunAdBlock) {
                    // Debounced ad removal
                    if (window.adBlockDebounce) clearTimeout(window.adBlockDebounce);
                    window.adBlockDebounce = setTimeout(() => {
                        removeElements(adSelectors);
                        performTextBasedAdDetection();
                    }, 100);
                }
            });

            // Start observing the document
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'data-ad', 'data-testid']
            });

            console.log('🛡️ Advanced mutation observer activated');
        };

        // Initialize advanced observer when body is available
        if (document.body) {
            setupAdvancedObserver();
        } else {
            document.addEventListener('DOMContentLoaded', setupAdvancedObserver);
        }

        // Enhanced JSON response cleaning
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            return originalFetch.apply(this, args).then(response => {
                if (response.url.includes('youtubei/v1') || response.url.includes('music.youtube.com')) {
                    const originalJson = response.json;
                    response.json = function() {
                        return originalJson.call(this).then(data => {
                            // Clean ad data from API responses
                            if (data && typeof data === 'object') {
                                // Remove ad-related properties
                                ['playerAds', 'adPlacements', 'adSlots', 'companionAds'].forEach(prop => {
                                    if (data[prop]) {
                                        delete data[prop];
                                        console.log(`🚫 Cleaned ${prop} from API response`);
                                    }
                                });
                            }
                            return data;
                        });
                    };
                }
                return response;
            });
        };

        console.log('🛡️ Advanced ad blocking system fully activated!');
    },

    // Enhanced continuous ad monitoring with improved detection
    startContinuousAdBlocking: () => {
            const text = el.textContent?.toLowerCase() || '';
            const isAdElement = adKeywords.some(keyword => text.includes(keyword));
            
            if (isAdElement && el.tagName !== 'BODY' && el.tagName !== 'HTML' && el.tagName !== 'TITLE') {
                // Check if it's likely an ad by examining context
                const parent = el.closest('ytmusic-popup-container, ytmusic-banner-promo-renderer, .ytmusic-premium-upsell-banner, [class*="ad"]');
                const hasAdClass = el.classList.toString().toLowerCase().includes('ad') || 
                                 el.id.toLowerCase().includes('ad') || 
                                 el.className.toLowerCase().includes('premium') ||
                                 el.className.toLowerCase().includes('upsell');
                
                if (parent || hasAdClass || text.trim().length < 100) {
                    el.style.display = 'none';
                    console.log('🚫 Removed ad element by text:', text.substring(0, 50));
                }
            }
        });

        // Block premium upgrade dialogs and modals with enhanced detection
        const modals = document.querySelectorAll('tp-yt-paper-dialog, ytmusic-popup-container, [role="dialog"], .ytmusic-modal-renderer');
        modals.forEach(modal => {
            const modalText = modal.textContent?.toLowerCase() || '';
            const modalClasses = modal.className?.toLowerCase() || '';
            
            if (modalText.includes('premium') || modalText.includes('upgrade') || 
                modalText.includes('ad-free') || modalText.includes('try it free') ||
                modalText.includes('start your free trial') || 
                modalClasses.includes('premium') || modalClasses.includes('upsell')) {
                modal.style.display = 'none';
                modal.remove();
                console.log('🚫 Blocked premium modal');
            }
        });

        // Enhanced video ad detection and blocking
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            // Check if video is an ad by source URL
            if (video.src && (video.src.includes('ad') || video.src.includes('promo')) && 
                !video.src.includes('range') && !video.src.includes('audio')) {
                video.pause();
                video.currentTime = video.duration || 0;
                video.style.display = 'none';
                console.log('🚫 Blocked video ad');
            }
            
            // Check for ad indicators in video container
            const videoContainer = video.closest('.html5-video-player');
            if (videoContainer && (videoContainer.classList.contains('ad-showing') || 
                                 videoContainer.classList.contains('ad-interrupting'))) {
                video.style.display = 'none';
                console.log('🚫 Blocked ad video container');
            }
        });

        // Remove overlay ads and interruptions with enhanced detection
        const overlays = document.querySelectorAll('[class*="overlay"], [class*="modal"], [class*="dialog"], [class*="popup"]');
        overlays.forEach(overlay => {
            const overlayText = overlay.textContent?.toLowerCase() || '';
            const overlayClasses = overlay.className?.toLowerCase() || '';
            
            if (overlayText.includes('advertisement') || overlayText.includes('sponsored') ||
                overlayText.includes('premium') || overlayText.includes('upgrade') ||
                overlayClasses.includes('ad') || overlayClasses.includes('promo')) {
                overlay.style.display = 'none';
                overlay.remove();
                console.log('🚫 Removed overlay ad');
            }
        });

        // Block YouTube Music specific interruption patterns
        const interruptElements = document.querySelectorAll('ytmusic-you-there-renderer, .ytmusic-you-there-renderer');
        interruptElements.forEach(el => {
            el.style.display = 'none';
            el.remove();
            console.log('🚫 Blocked YouTube Music interruption');
        });

        console.log('✅ Comprehensive ad removal completed - uBlock Origin style!');
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
