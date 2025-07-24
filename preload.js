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
    
    // Enhanced Settings
    getSetting: (key, defaultValue) => ipcRenderer.invoke('get-setting', key, defaultValue),
    setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
    getAllSettings: () => ipcRenderer.invoke('get-all-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    
    // Feature Controls
    openSettings: () => ipcRenderer.invoke('open-settings'),
    openMiniPlayer: () => ipcRenderer.invoke('open-mini-player'),
    toggleBackgroundPlay: (enabled) => ipcRenderer.invoke('toggle-background-play', enabled),
    
    // Track Management
    getCurrentTrack: () => ipcRenderer.invoke('get-current-track'),
    setCurrentTrack: (track) => ipcRenderer.invoke('set-current-track', track),
    showNotification: (track) => ipcRenderer.invoke('show-notification', track),
    
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

// Enhanced YouTube Music initialization with advanced features and UI
window.addEventListener('DOMContentLoaded', () => {
    console.log('🎵 YouTube Music Desktop App initialized');
    
    // Inject custom CSS for UI enhancements
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'file://' + __dirname + '/custom-ui.css';
    document.head.appendChild(cssLink);
    
    // Add custom UI elements
    setTimeout(() => {
        addSettingsButton();
        addMiniPlayerButton();
    }, 3000);
    
    // Run initial ad removal after page loads
    setTimeout(() => {
        if (window.ytMusic && window.ytMusic.removeAds) {
            window.ytMusic.removeAds();
        }
        
        // Start track monitoring
        startTrackMonitoring();
        
        // Load user settings and apply features
        loadAndApplySettings();
    }, 2000);
    
    // Run basic ad removal every 30 seconds (gentle approach)
    setInterval(() => {
        if (window.ytMusic && window.ytMusic.removeAds) {
            window.ytMusic.removeAds();
        }
    }, 30000);
});

// Track monitoring for notifications and integrations
let lastTrackInfo = {};

function startTrackMonitoring() {
    setInterval(async () => {
        const currentTrack = window.ytMusic.getCurrentTrack();
        
        if (currentTrack && currentTrack.title && 
            (currentTrack.title !== lastTrackInfo.title || 
             currentTrack.artist !== lastTrackInfo.artist)) {
            
            lastTrackInfo = currentTrack;
            
            // Send track info to main process
            try {
                await window.electronAPI.setCurrentTrack(currentTrack);
                console.log('🎵 Track changed:', currentTrack.title, 'by', currentTrack.artist);
            } catch (error) {
                console.error('Error updating track info:', error);
            }
        }
    }, 1000);
}

// Load settings and apply visual/audio enhancements
async function loadAndApplySettings() {
    try {
        const settings = await window.electronAPI.getAllSettings();
        
        // Apply visual enhancements
        if (settings.animatedBackground) {
            enableAnimatedBackground();
        }
        
        if (settings.visualizer) {
            enableVisualizer();
        }
        
        if (settings.customThemes) {
            enableCustomThemes();
        }
        
        // Apply audio enhancements
        if (settings.equalizerEnabled) {
            enableEqualizer(settings);
        }
        
        if (settings.audioNormalization) {
            enableAudioNormalization();
        }
        
        if (settings.bassBoost > 0) {
            enableBassBoost(settings.bassBoost);
        }
        
        console.log('⚙️ Settings applied successfully');
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Visual Enhancement Functions
function enableAnimatedBackground() {
    const style = document.createElement('style');
    style.textContent = `
        ytmusic-app-layout {
            background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            background-size: 400% 400%;
            animation: gradientShift 15s ease infinite;
        }
        
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        ytmusic-player-bar {
            backdrop-filter: blur(20px);
            background: rgba(0, 0, 0, 0.7) !important;
        }
    `;
    document.head.appendChild(style);
    console.log('🎨 Animated background enabled');
}

function enableVisualizer() {
    // Create visualizer canvas
    const visualizer = document.createElement('canvas');
    visualizer.id = 'audioVisualizer';
    visualizer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        opacity: 0.3;
    `;
    document.body.appendChild(visualizer);
    
    // Audio context and analyzer setup
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    // Try to connect to audio element
    const audio = document.querySelector('video');
    if (audio) {
        try {
            const source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            // Start visualization
            visualizeAudio(visualizer, analyser);
            console.log('🎵 Audio visualizer enabled');
        } catch (error) {
            console.log('Visualizer setup delayed - waiting for audio');
        }
    }
}

function visualizeAudio(canvas, analyser) {
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        requestAnimationFrame(draw);
        
        analyser.getByteFrequencyData(dataArray);
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height * 0.7;
            
            const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
            gradient.addColorStop(0, `hsl(${i * 2}, 100%, 50%)`);
            gradient.addColorStop(1, `hsl(${i * 2}, 100%, 20%)`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
    }
    
    draw();
}

function enableCustomThemes() {
    // Add theme customization CSS
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --ytmusic-color-grey1: #1a1a1a;
            --ytmusic-color-grey2: #2a2a2a;
            --ytmusic-color-grey3: #3a3a3a;
            --ytmusic-color-text1: #ffffff;
            --ytmusic-color-text2: #b3b3b3;
            --yt-spec-brand-background-solid: #ff6b6b;
            --yt-spec-brand-background-primary: #ff6b6b;
        }
        
        ytmusic-app-layout {
            --ytmusic-brand-color: #ff6b6b;
        }
    `;
    document.head.appendChild(style);
    console.log('🎨 Custom themes enabled');
}

// Audio Enhancement Functions
function enableEqualizer(settings) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const video = document.querySelector('video');
    
    if (video && audioContext) {
        try {
            const source = audioContext.createMediaElementSource(video);
            const gainNode = audioContext.createGain();
            
            // Create EQ filters
            const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
            const filters = frequencies.map((freq, index) => {
                const filter = audioContext.createBiquadFilter();
                filter.type = 'peaking';
                filter.frequency.value = freq;
                filter.Q.value = 1;
                filter.gain.value = settings[`eq${freq === 1000 ? '1k' : freq === 3000 ? '3k' : freq === 6000 ? '6k' : freq === 12000 ? '12k' : freq === 14000 ? '14k' : freq === 16000 ? '16k' : freq}`] || 0;
                return filter;
            });
            
            // Connect audio chain
            source.connect(filters[0]);
            for (let i = 0; i < filters.length - 1; i++) {
                filters[i].connect(filters[i + 1]);
            }
            filters[filters.length - 1].connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            console.log('🎛️ Equalizer enabled');
        } catch (error) {
            console.log('Equalizer setup delayed - waiting for audio');
        }
    }
}

function enableAudioNormalization() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const video = document.querySelector('video');
    
    if (video && audioContext) {
        try {
            const source = audioContext.createMediaElementSource(video);
            const compressor = audioContext.createDynamicsCompressor();
            
            compressor.threshold.value = -24;
            compressor.knee.value = 30;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;
            
            source.connect(compressor);
            compressor.connect(audioContext.destination);
            
            console.log('🔊 Audio normalization enabled');
        } catch (error) {
            console.log('Audio normalization setup delayed');
        }
    }
}

function enableBassBoost(level) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const video = document.querySelector('video');
    
    if (video && audioContext) {
        try {
            const source = audioContext.createMediaElementSource(video);
            const bassFilter = audioContext.createBiquadFilter();
            
            bassFilter.type = 'lowshelf';
            bassFilter.frequency.value = 320;
            bassFilter.gain.value = level * 0.3; // Convert 0-100 to reasonable dB range
            
            source.connect(bassFilter);
            bassFilter.connect(audioContext.destination);
            
            console.log(`🎵 Bass boost enabled: ${level}%`);
        } catch (error) {
            console.log('Bass boost setup delayed');
        }
    }
}

// UI Enhancement Functions
// Add settings button to YouTube Music interface
function addSettingsButton() {
    // Check if button already exists
    if (document.querySelector('.yt-music-settings-button')) {
        return;
    }
    
    const settingsButton = document.createElement('div');
    settingsButton.className = 'yt-music-settings-button';
    settingsButton.innerHTML = `
        <svg class="yt-music-settings-icon" viewBox="0 0 24 24">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
        </svg>
        Settings
    `;
    
    settingsButton.addEventListener('click', () => {
        if (window.electronAPI && window.electronAPI.openSettings) {
            window.electronAPI.openSettings();
        }
    });
    
    document.body.appendChild(settingsButton);
    console.log('⚙️ Settings button added to interface');
}

// Add mini player button to YouTube Music interface
function addMiniPlayerButton() {
    // Check if button already exists
    if (document.querySelector('.yt-music-mini-player-button')) {
        return;
    }
    
    const miniPlayerButton = document.createElement('div');
    miniPlayerButton.className = 'yt-music-mini-player-button';
    miniPlayerButton.innerHTML = `
        <svg class="yt-music-settings-icon" viewBox="0 0 24 24">
            <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
        </svg>
        Mini Player
    `;
    
    miniPlayerButton.addEventListener('click', () => {
        if (window.electronAPI && window.electronAPI.openMiniPlayer) {
            window.electronAPI.openMiniPlayer();
        }
    });
    
    document.body.appendChild(miniPlayerButton);
    console.log('📱 Mini player button added to interface');
}
