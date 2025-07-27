/**
 * Application Constants and Default Settings
 */

const defaultSettings = {
    // Playback Features
    backgroundPlay: true,
    autoPauseOnInterruption: true,
    crossfade: false,
    gaplessPlayback: true,
    
    // System Integration
    startWithWindows: false,
    systemTray: true,
    mediaKeys: true,
    discordRichPresence: false,
    
    // Audio Enhancement
    equalizerEnabled: false,
    audioNormalization: true,
    bassBoost: 0,
    
    // Equalizer bands
    eq60: 0, eq170: 0, eq310: 0, eq600: 0, eq1k: 0,
    eq3k: 0, eq6k: 0, eq12k: 0, eq14k: 0, eq16k: 0,
    
    // Visual & Interface
    customThemes: false,
    animatedBackground: true,
    visualizer: false,
    
    // UI Enhancement Settings
    glassEffect: true,
    glassTheme: 'glass-dark',
    animationLevel: 'medium',
    transparencyLevel: 0.8,
    
    // Playback Features
    inactivityBypass: true,
    miniPlayer: false,
    
    // Notifications & Feedback
    desktopNotifications: true,
    lastfmScrobbling: false,
    hapticFeedback: false,
    
    // Last.fm credentials
    lastfmApiKey: '',
    lastfmApiSecret: '',
    lastfmSessionKey: '',
    
    // Discord Rich Presence
    discordClientId: '1234567890123456789'
};

const appConstants = {
    APP_NAME: 'YouTube Music Desktop',
    YOUTUBE_MUSIC_URL: 'https://music.youtube.com',
    WINDOW_BOUNDS_DEFAULT: { width: 1400, height: 900 },
    MINI_PLAYER_SIZE: { width: 400, height: 150 },
    SETTINGS_WINDOW_SIZE: { width: 900, height: 700 },
    ABOUT_WINDOW_SIZE: { width: 400, height: 300 },
    SHORTCUTS_WINDOW_SIZE: { width: 500, height: 600 },
    
    // DOM Selectors for YouTube Music
    SELECTORS: {
        PLAY_PAUSE: '[data-id="play-pause-button"], #play-pause-button, paper-icon-button[data-id="play-pause-button"], ytmusic-player-bar paper-icon-button[title*="play"], ytmusic-player-bar paper-icon-button[title*="pause"]',
        NEXT: '[data-id="next-button"], #next-button, paper-icon-button[data-id="next-button"], ytmusic-player-bar paper-icon-button[title*="next"]',
        PREVIOUS: '[data-id="previous-button"], #previous-button, paper-icon-button[data-id="previous-button"], ytmusic-player-bar paper-icon-button[title*="previous"]',
        VOLUME: '#volume-slider input, tp-yt-paper-slider[aria-label*="volume"], ytmusic-player-bar tp-yt-paper-slider',
        SEARCH: 'ytmusic-search-box input, #search-input, input[placeholder*="Search"], ytmusic-search-box #input',
        HOME: 'a[href="/"], ytmusic-nav-bar a[href="/"], ytmusic-pivot-bar-item-renderer[tab-identifier="FEmusic_home"]',
        EXPLORE: 'a[href*="explore"], ytmusic-nav-bar a[href*="explore"], ytmusic-pivot-bar-item-renderer[tab-identifier="FEmusic_explore"]',
        LIBRARY: 'a[href*="library"], ytmusic-nav-bar a[href*="library"], ytmusic-pivot-bar-item-renderer[tab-identifier="FEmusic_library_landing"]'
    },
    
    // Ad blocking patterns
    AD_BLOCKING_PATTERNS: [
        '*://*.googlesyndication.com/*',
        '*://*.googleadservices.com/*',
        '*://*.googletagmanager.com/gtag/*',
        '*://*.googletagservices.com/*',
        '*://*.google-analytics.com/*',
        '*://*.doubleclick.net/*',
        '*://*/pagead/interaction*',
        '*://*/pagead/adview*',
        '*://*/api/stats/ads*',
        '*://*/get_midroll_info*',
        '*://*/annotations_invideo*',
        '*://*/player_ads_config*',
        '*://*/*ad_type=*',
        '*://*/*adurl=*',
        '*://*/*advertiser_id=*'
    ],
    
    // Essential patterns that should never be blocked
    ESSENTIAL_PATTERNS: [
        'youtubei/v1/player',
        'youtubei/v1/next',
        'youtubei/v1/browse',
        'youtubei/v1/search',
        'videoplayback',
        'api/stats/qoe',
        'api/stats/watchtime',
        'generate_204',
        'range=',
        'mime=audio',
        'mime=video'
    ]
};

module.exports = {
    defaultSettings,
    appConstants
};
