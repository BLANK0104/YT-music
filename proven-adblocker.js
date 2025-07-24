/**
 * Proven YouTube Music Ad Blocker
 * Based on successful techniques from Brave Browser, uBlock Origin, and AdBlock Plus
 * Specifically designed for YouTube Music with video playback protection
 */

class ProvenAdBlocker {
    constructor() {
        this.isInitialized = false;
        this.blockedRequests = 0;
        this.adPatterns = this.initializeAdPatterns();
        this.init();
    }

    initializeAdPatterns() {
        return {
            // Network-level blocking patterns (proven effective)
            networkPatterns: [
                // Google Ad Services
                /^https?:\/\/.*\.googlesyndication\.com\/.*/,
                /^https?:\/\/.*\.googleadservices\.com\/.*/,
                /^https?:\/\/.*\.googletagmanager\.com\/gtag\/.*/,
                /^https?:\/\/.*\.googletagservices\.com\/.*/,
                /^https?:\/\/.*\.google-analytics\.com\/.*/,
                
                // DoubleClick (Google's ad platform)
                /^https?:\/\/.*\.doubleclick\.net\/.*/,
                /^https?:\/\/.*\.googleadservices\.com\/.*/,
                
                // YouTube specific ad endpoints
                /\/pagead\/interaction\?/,
                /\/pagead\/adview\?/,
                /\/api\/stats\/ads/,
                /\/get_midroll_info/,
                /\/annotations_invideo/,
                /\/player_ads_config/,
                
                // Generic ad patterns
                /[?&]ad_type=/,
                /[?&]adurl=/,
                /[?&]advertiser_id=/,
                /\/ads\//,
                /\/advertisement/,
                /\/sponsorship/
            ],
            
            // CSS selectors for ad elements (YouTube Music specific)
            cssSelectors: [
                // Direct ad containers
                '.ytmusic-popup-container[popup-type*="ads"]',
                '.ytmusic-popup-container[popup-type*="premium"]',
                'ytmusic-premium-upsell-banner',
                '.ytmusic-premium-upsell-banner',
                '.ytmusic-banner-promo-renderer',
                '.advertisement-shelf-renderer',
                '.ytmusic-you-there-renderer',
                
                // Premium prompts
                'ytmusic-notification-action-renderer[aria-label*="Premium"]',
                'ytmusic-notification-action-renderer[aria-label*="Try Premium"]',
                'ytmusic-notification-action-renderer[aria-label*="Upgrade"]',
                '[aria-label*="Get YouTube Premium"]',
                '[aria-label*="Go Premium"]',
                
                // Video ads (be very careful here)
                '.ytp-ad-module:not(.ytp-player)',
                '.ytp-ad-overlay-container:not(.ytp-player)',
                '.ytp-ad-text-overlay:not(.ytp-player)',
                '.ytp-ad-player-overlay',
                '.ytp-ad-image-overlay',
                '.ytp-ad-skip-button-container',
                '.videoAdUi',
                '.videoAdUiSkipButton',
                '.videoAdUiActionButton',
                '.ytp-ad-text',
                '.ytp-ad-preview-container',
                
                // Generic patterns
                '[class*="ad-"]:not([class*="add"]):not([class*="radio"]):not([class*="head"]):not([class*="advanced"])',
                '[id*="ad-"]:not([id*="add"]):not([id*="radio"])',
                '[data-ad-slot]',
                '[data-google-av-cxn]',
                
                // YouTube Music specific interruptions
                'ytmusic-you-there-renderer',
                '.ytmusic-you-there-renderer',
                'ytmusic-interruption-modal',
                '.ytmusic-interruption-modal',
                
                // Popup ads and overlays
                '[class*="popup"][class*="ad"]',
                '[class*="overlay"][class*="ad"]',
                '[class*="banner"][class*="ad"]',
                
                // Sponsored content
                '[class*="sponsor"]',
                '[data-sponsor]',
                '.sponsored-content',
                
                // More aggressive patterns
                'iframe[src*="doubleclick"]',
                'iframe[src*="googlesyndication"]',
                'iframe[src*="googleadservices"]',
                'script[src*="googletag"]',
                'script[src*="doubleclick"]',
                'script[src*="googlesyndication"]'
            ],
            
            // Essential URLs that should NEVER be blocked
            essentialPatterns: [
                /\/youtubei\/v1\/player/,
                /\/youtubei\/v1\/next/,
                /\/youtubei\/v1\/browse/,
                /\/youtubei\/v1\/search/,
                /\/videoplayback/,
                /\/api\/stats\/qoe/,
                /\/api\/stats\/watchtime/,
                /\/generate_204/,
                /range=/,
                /mime=audio/,
                /mime=video/,
                /gvn=/,
                /rn=/,
                /rbuf=/
            ]
        };
    }

    init() {
        this.setupNetworkBlocking();
        this.setupDOMBlocking();
        this.setupVideoAdBlocking();
        this.setupMutationObserver();
        this.injectAdBlockingCSS();
        this.isInitialized = true;
        console.log('🛡️ Proven Ad Blocker initialized successfully');
    }

    injectAdBlockingCSS() {
        const adBlockingCSS = `
            /* Hide all ad-related elements */
            [class*="ad-"]:not([class*="add"]):not([class*="radio"]):not([class*="head"]):not([class*="advanced"]),
            [id*="ad-"]:not([id*="add"]):not([id*="radio"]),
            [class*="ads-"]:not([class*="heads"]):not([class*="broadcast"]),
            [data-ad],
            [data-ad-slot],
            [data-google-av-cxn],
            .ytp-ad-module,
            .ytp-ad-overlay-container,
            .ytp-ad-text-overlay,
            .ytp-ad-player-overlay,
            .ytp-ad-image-overlay,
            .ytp-ad-skip-button-container,
            .videoAdUi,
            .videoAdUiSkipButton,
            .videoAdUiActionButton,
            .ytp-ad-text,
            .ytp-ad-preview-container,
            .advertisement-shelf-renderer,
            ytmusic-premium-upsell-banner,
            .ytmusic-premium-upsell-banner,
            .ytmusic-banner-promo-renderer,
            .ytmusic-you-there-renderer,
            ytmusic-you-there-renderer,
            iframe[src*="doubleclick"],
            iframe[src*="googlesyndication"],
            iframe[src*="googleadservices"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                position: absolute !important;
                left: -9999px !important;
                z-index: -1 !important;
            }
            
            /* Ensure video player stays visible */
            video,
            .html5-video-player,
            .ytp-player,
            #movie_player {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = adBlockingCSS;
        document.head.appendChild(style);
        console.log('🎨 Ad-blocking CSS injected');
    }

    setupNetworkBlocking() {
        // Intercept and block ad requests
        const originalFetch = window.fetch;
        window.fetch = async function(input, init) {
            const url = typeof input === 'string' ? input : input.url;
            
            if (this.shouldBlockRequest(url)) {
                console.log('🚫 Blocked network request:', url);
                this.blockedRequests++;
                // Return empty response instead of failing
                return new Response('{}', {
                    status: 200,
                    statusText: 'OK',
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            return originalFetch.call(this, input, init);
        }.bind(this);

        // Intercept XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            if (this.shouldBlockRequest(url)) {
                console.log('🚫 Blocked XHR request:', url);
                this.blockedRequests++;
                // Create a dummy response
                this.addEventListener('readystatechange', function() {
                    if (this.readyState === 4) {
                        Object.defineProperty(this, 'status', { value: 200 });
                        Object.defineProperty(this, 'responseText', { value: '{}' });
                    }
                });
                return;
            }
            return originalXHROpen.call(this, method, url, ...args);
        }.bind(this);
    }

    shouldBlockRequest(url) {
        // Never block essential requests
        if (this.adPatterns.essentialPatterns.some(pattern => pattern.test(url))) {
            return false;
        }
        
        // Block known ad patterns
        return this.adPatterns.networkPatterns.some(pattern => pattern.test(url));
    }

    setupDOMBlocking() {
        const removeAds = () => {
            let removedCount = 0;
            
            this.adPatterns.cssSelectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (el && el.parentNode && !el.hasAttribute('data-ad-blocked')) {
                            // Use multiple hiding techniques for resilience
                            el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; width: 0 !important; position: absolute !important; left: -9999px !important;';
                            el.hidden = true;
                            el.setAttribute('data-ad-blocked', 'true');
                            removedCount++;
                        }
                    });
                } catch (e) {
                    // Ignore selector errors
                }
            });
            
            // Text-based ad detection
            const textAds = document.querySelectorAll('*');
            textAds.forEach(el => {
                if (el.children.length === 0 && el.textContent) {
                    const text = el.textContent.toLowerCase();
                    const adKeywords = [
                        'try premium', 'get premium', 'upgrade to premium',
                        'youtube premium', 'ad-free music', 'no ads',
                        'skip ad', 'advertisement'
                    ];
                    
                    if (adKeywords.some(keyword => text.includes(keyword))) {
                        const container = el.closest('div, section, article');
                        if (container && !container.hasAttribute('data-text-ad-blocked')) {
                            container.style.display = 'none !important';
                            container.setAttribute('data-text-ad-blocked', 'true');
                            removedCount++;
                        }
                    }
                }
            });
            
            if (removedCount > 0) {
                console.log(`🚫 Removed ${removedCount} ad elements via DOM blocking`);
            }
        };

        // Run immediately and then periodically
        removeAds();
        setInterval(removeAds, 5000);
    }

    setupVideoAdBlocking() {
        const blockVideoAds = () => {
            const video = document.querySelector('video');
            if (!video) return;

            // Check for video ad indicators
            const player = document.querySelector('#movie_player');
            if (player) {
                const isAdShowing = player.classList.contains('ad-showing') || 
                                  player.classList.contains('ad-interrupting') ||
                                  document.querySelector('.ytp-ad-module') ||
                                  document.querySelector('.ytp-ad-overlay-container') ||
                                  document.querySelector('.ytp-ad-text') ||
                                  document.querySelector('[class*="ad-"]') ||
                                  player.querySelector('.ytp-ad-skip-button');

                if (isAdShowing) {
                    console.log('🚫 Video ad detected, applying aggressive countermeasures...');
                    
                    // Multiple ad-skipping techniques
                    video.playbackRate = 16;
                    video.muted = true;
                    video.currentTime = video.duration - 0.1;
                    
                    // Hide ad elements immediately
                    const adElements = document.querySelectorAll('.ytp-ad-module, .ytp-ad-overlay-container, .ytp-ad-text-overlay, .ytp-ad-player-overlay, [class*="ad-"]');
                    adElements.forEach(el => {
                        el.style.display = 'none !important';
                        el.remove();
                    });
                    
                    // Try to skip immediately
                    const skipButtons = document.querySelectorAll(
                        '.ytp-ad-skip-button, .ytp-skip-ad-button, [aria-label*="Skip"], .ytp-ad-skip-button-modern, .ytp-skip-ad-button, .videoAdUiSkipButton'
                    );
                    skipButtons.forEach(btn => {
                        if (btn && !btn.disabled) {
                            btn.click();
                            console.log('🚫 Clicked skip button');
                        }
                    });

                    // Force end ad by manipulating player
                    setTimeout(() => {
                        if (video.duration && !isNaN(video.duration)) {
                            video.currentTime = video.duration;
                        }
                    }, 100);
                }
                
                // Always remove ad overlays regardless of ad state
                const overlays = document.querySelectorAll('.ytp-ad-overlay-container, .ytp-ad-text-overlay, .ytp-ad-image-overlay');
                overlays.forEach(overlay => {
                    overlay.style.display = 'none !important';
                    overlay.remove();
                });
            }
        };

        // Monitor video ads more frequently
        setInterval(blockVideoAds, 500);
        
        // Also monitor on video events
        const video = document.querySelector('video');
        if (video) {
            video.addEventListener('loadstart', blockVideoAds);
            video.addEventListener('loadeddata', blockVideoAds);
            video.addEventListener('play', blockVideoAds);
        }
    }

    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if new node contains ads
                            const element = node;
                            const html = element.outerHTML?.toLowerCase() || '';
                            
                            if (html.includes('ad') || html.includes('premium') || html.includes('sponsor')) {
                                setTimeout(() => {
                                    this.adPatterns.cssSelectors.forEach(selector => {
                                        const ads = element.querySelectorAll(selector);
                                        ads.forEach(ad => {
                                            if (ad && !ad.hasAttribute('data-ad-blocked')) {
                                                ad.style.display = 'none !important';
                                                ad.setAttribute('data-ad-blocked', 'true');
                                            }
                                        });
                                    });
                                }, 100);
                            }
                        }
                    });
                }
            });
        });

        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style', 'data-ad']
            });
        }
    }

    getStats() {
        return {
            blockedRequests: this.blockedRequests,
            isActive: this.isInitialized
        };
    }
}

// Initialize the proven ad blocker
if (typeof window !== 'undefined' && !window.provenAdBlocker) {
    window.provenAdBlocker = new ProvenAdBlocker();
    
    // Expose to electron context
    if (window.electronAPI) {
        window.electronAPI.adBlockerStats = () => window.provenAdBlocker.getStats();
    }
    
    // Additional aggressive blocking for YouTube Music
    const aggressiveBlocking = () => {
        // Remove any elements with "ad" in their innerHTML
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            if (el.innerHTML && el.innerHTML.toLowerCase().includes('advertisement') && 
                !el.closest('video') && el.tagName !== 'VIDEO') {
                el.style.display = 'none !important';
                el.remove();
            }
        });
        
        // Block any iframes that might contain ads
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const src = iframe.src?.toLowerCase() || '';
            if (src.includes('doubleclick') || src.includes('googlesyndication') || 
                src.includes('googleadservices') || src.includes('ads')) {
                iframe.style.display = 'none !important';
                iframe.remove();
                console.log('🚫 Removed ad iframe:', src);
            }
        });
    };
    
    // Run aggressive blocking every 2 seconds
    setInterval(aggressiveBlocking, 2000);
    
    // Run immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', aggressiveBlocking);
    } else {
        aggressiveBlocking();
    }
}

console.log('🛡️ Proven Ad Blocker loaded and active');
