/**
 * UI Enhancement Module - Modern Glass Morphism & Transparency Effects
 */

const appState = require('../utils/state');

class UIEnhancer {
    constructor() {
        this.isGlassEnabled = false;
        this.currentTheme = 'glass-dark';
        this.animationLevel = 'medium';
        this.customCSS = null;
    }

    async enableGlassMorphism(theme = 'glass-dark') {
        const mainWindow = appState.getMainWindow();
        if (!mainWindow) return;

        this.isGlassEnabled = true;
        this.currentTheme = theme;

        // Apply transparency to window
        this.setupWindowTransparency(mainWindow);

        // Inject glass morphism CSS
        const glassCSS = this.generateGlassMorphismCSS(theme);
        
        await mainWindow.webContents.executeJavaScript(`
            (function() {
                try {
                    // Remove existing glass styles
                    const existingStyle = document.getElementById('glass-morphism-style');
                    if (existingStyle) {
                        existingStyle.remove();
                    }

                    // Create new glass style
                    const style = document.createElement('style');
                    style.id = 'glass-morphism-style';
                    style.textContent = \`${glassCSS}\`;
                    document.head.appendChild(style);

                    // Add glass class to body
                    document.body.classList.add('glass-morphism');
                    document.body.classList.add('${theme}');

                    // Initialize glass animations
                    ${this.getGlassAnimationScript()}

                    console.log('✨ Glass morphism enabled with theme: ${theme}');
                } catch (error) {
                    console.error('Failed to enable glass morphism:', error);
                }
            })();
        `);

        console.log(`✨ Glass morphism UI enabled with theme: ${theme}`);
    }

    setupWindowTransparency(window) {
        // Enable transparency and vibrancy effects
        if (process.platform === 'win32') {
            // Windows Acrylic effect
            window.setBackgroundColor('#00000000');
        } else if (process.platform === 'darwin') {
            // macOS vibrancy
            window.setVibrancy('ultra-dark');
        } else {
            // Linux transparency
            window.setBackgroundColor('#AA000000');
        }
    }

    generateGlassMorphismCSS(theme) {
        const themes = {
            'glass-dark': {
                primary: 'rgba(15, 15, 23, 0.8)',
                secondary: 'rgba(25, 25, 35, 0.7)',
                accent: 'rgba(78, 205, 196, 0.9)',
                glass: 'rgba(255, 255, 255, 0.1)',
                glassBorder: 'rgba(255, 255, 255, 0.2)',
                text: 'rgba(255, 255, 255, 0.9)',
                textSecondary: 'rgba(255, 255, 255, 0.7)',
                blur: '20px',
                shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
            },
            'glass-light': {
                primary: 'rgba(255, 255, 255, 0.8)',
                secondary: 'rgba(245, 245, 245, 0.7)',
                accent: 'rgba(25, 118, 210, 0.9)',
                glass: 'rgba(255, 255, 255, 0.25)',
                glassBorder: 'rgba(255, 255, 255, 0.3)',
                text: 'rgba(0, 0, 0, 0.9)',
                textSecondary: 'rgba(0, 0, 0, 0.7)',
                blur: '20px',
                shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)'
            },
            'glass-purple': {
                primary: 'rgba(25, 15, 35, 0.8)',
                secondary: 'rgba(45, 25, 55, 0.7)',
                accent: 'rgba(156, 39, 176, 0.9)',
                glass: 'rgba(156, 39, 176, 0.15)',
                glassBorder: 'rgba(156, 39, 176, 0.3)',
                text: 'rgba(255, 255, 255, 0.9)',
                textSecondary: 'rgba(209, 196, 233, 0.8)',
                blur: '25px',
                shadow: '0 8px 32px 0 rgba(156, 39, 176, 0.3)'
            },
            'glass-blue': {
                primary: 'rgba(15, 20, 35, 0.8)',
                secondary: 'rgba(30, 42, 58, 0.7)',
                accent: 'rgba(33, 150, 243, 0.9)',
                glass: 'rgba(33, 150, 243, 0.15)',
                glassBorder: 'rgba(33, 150, 243, 0.3)',
                text: 'rgba(255, 255, 255, 0.9)',
                textSecondary: 'rgba(187, 222, 251, 0.8)',
                blur: '22px',
                shadow: '0 8px 32px 0 rgba(33, 150, 243, 0.3)'
            }
        };

        const t = themes[theme] || themes['glass-dark'];

        return `
            /* Glass Morphism Base Styles */
            .glass-morphism {
                --glass-primary: ${t.primary};
                --glass-secondary: ${t.secondary};
                --glass-accent: ${t.accent};
                --glass-surface: ${t.glass};
                --glass-border: ${t.glassBorder};
                --glass-text: ${t.text};
                --glass-text-secondary: ${t.textSecondary};
                --glass-blur: ${t.blur};
                --glass-shadow: ${t.shadow};
            }

            /* Main Application Background */
            .glass-morphism ytmusic-app,
            .glass-morphism ytmusic-app-layout,
            .glass-morphism #layout,
            .glass-morphism #background {
                background: linear-gradient(135deg, var(--glass-primary) 0%, var(--glass-secondary) 100%) !important;
                backdrop-filter: blur(var(--glass-blur)) !important;
                -webkit-backdrop-filter: blur(var(--glass-blur)) !important;
                border: 1px solid var(--glass-border) !important;
                box-shadow: var(--glass-shadow) !important;
                color: var(--glass-text) !important;
                position: relative !important;
            }

            /* Glass Navigation Bar */
            .glass-morphism ytmusic-nav-bar,
            .glass-morphism .navigation-bar {
                background: var(--glass-surface) !important;
                backdrop-filter: blur(15px) !important;
                -webkit-backdrop-filter: blur(15px) !important;
                border: 1px solid var(--glass-border) !important;
                border-radius: 12px !important;
                margin: 8px !important;
                box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2) !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            .glass-morphism ytmusic-nav-bar:hover {
                background: rgba(255, 255, 255, 0.15) !important;
                box-shadow: 0 6px 20px 0 rgba(0, 0, 0, 0.3) !important;
                transform: translateY(-1px) !important;
            }

            /* Glass Player Bar */
            .glass-morphism ytmusic-player-bar,
            .glass-morphism .player-bar {
                background: var(--glass-surface) !important;
                backdrop-filter: blur(20px) !important;
                -webkit-backdrop-filter: blur(20px) !important;
                border: 1px solid var(--glass-border) !important;
                border-radius: 16px !important;
                margin: 8px !important;
                box-shadow: var(--glass-shadow) !important;
                animation: glassFloat 4s ease-in-out infinite !important;
            }

            /* Glass Cards and Containers */
            .glass-morphism .ytmusic-card,
            .glass-morphism .ytmusic-shelf,
            .glass-morphism .ytmusic-section-list-renderer,
            .glass-morphism .content-container {
                background: var(--glass-surface) !important;
                backdrop-filter: blur(12px) !important;
                -webkit-backdrop-filter: blur(12px) !important;
                border: 1px solid var(--glass-border) !important;
                border-radius: 12px !important;
                box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15) !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                margin: 4px !important;
            }

            .glass-morphism .ytmusic-card:hover {
                background: rgba(255, 255, 255, 0.12) !important;
                transform: translateY(-2px) scale(1.02) !important;
                box-shadow: 0 8px 25px 0 rgba(0, 0, 0, 0.25) !important;
            }

            /* Glass Buttons */
            .glass-morphism .yt-simple-endpoint,
            .glass-morphism paper-button,
            .glass-morphism .button {
                background: var(--glass-surface) !important;
                backdrop-filter: blur(10px) !important;
                -webkit-backdrop-filter: blur(10px) !important;
                border: 1px solid var(--glass-border) !important;
                border-radius: 8px !important;
                color: var(--glass-text) !important;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                position: relative !important;
                overflow: hidden !important;
            }

            .glass-morphism .yt-simple-endpoint:hover,
            .glass-morphism paper-button:hover {
                background: var(--glass-accent) !important;
                color: white !important;
                transform: scale(1.05) !important;
                box-shadow: 0 4px 15px 0 rgba(0, 0, 0, 0.3) !important;
            }

            .glass-morphism .yt-simple-endpoint:active {
                transform: scale(0.98) !important;
            }

            /* Glass Scrollbars */
            .glass-morphism ::-webkit-scrollbar {
                width: 8px !important;
                height: 8px !important;
            }

            .glass-morphism ::-webkit-scrollbar-track {
                background: var(--glass-surface) !important;
                border-radius: 4px !important;
            }

            .glass-morphism ::-webkit-scrollbar-thumb {
                background: var(--glass-accent) !important;
                border-radius: 4px !important;
                border: 1px solid var(--glass-border) !important;
            }

            .glass-morphism ::-webkit-scrollbar-thumb:hover {
                background: var(--glass-text-secondary) !important;
            }

            /* Glass Text Styles */
            .glass-morphism .title,
            .glass-morphism .subtitle-1,
            .glass-morphism .body-1,
            .glass-morphism h1, .glass-morphism h2, .glass-morphism h3 {
                color: var(--glass-text) !important;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
            }

            .glass-morphism .subtitle-2,
            .glass-morphism .body-2,
            .glass-morphism .byline {
                color: var(--glass-text-secondary) !important;
                text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2) !important;
            }

            /* Glass Animations */
            @keyframes glassFloat {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-2px); }
            }

            @keyframes glassShimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }

            @keyframes glassGlow {
                0%, 100% { box-shadow: var(--glass-shadow); }
                50% { box-shadow: var(--glass-shadow), 0 0 20px var(--glass-accent); }
            }

            /* Glass Ripple Effect */
            .glass-morphism .yt-simple-endpoint::before,
            .glass-morphism paper-button::before {
                content: '';
                position: absolute !important;
                top: 50% !important;
                left: 50% !important;
                width: 0 !important;
                height: 0 !important;
                background: radial-gradient(circle, var(--glass-accent) 0%, transparent 70%) !important;
                transform: translate(-50%, -50%) !important;
                transition: width 0.3s, height 0.3s !important;
                border-radius: 50% !important;
                pointer-events: none !important;
            }

            .glass-morphism .yt-simple-endpoint:hover::before,
            .glass-morphism paper-button:hover::before {
                width: 100px !important;
                height: 100px !important;
            }

            /* Glass Menu Items */
            .glass-morphism .ytmusic-menu-item,
            .glass-morphism iron-dropdown {
                background: var(--glass-surface) !important;
                backdrop-filter: blur(15px) !important;
                -webkit-backdrop-filter: blur(15px) !important;
                border: 1px solid var(--glass-border) !important;
                border-radius: 8px !important;
                box-shadow: var(--glass-shadow) !important;
            }

            /* Glass Progress Bars */
            .glass-morphism .progress-bar,
            .glass-morphism paper-progress {
                background: var(--glass-surface) !important;
                border-radius: 4px !important;
                overflow: hidden !important;
            }

            .glass-morphism .progress-bar .progress-fill {
                background: linear-gradient(90deg, var(--glass-accent), rgba(255, 255, 255, 0.8)) !important;
                box-shadow: 0 0 10px var(--glass-accent) !important;
            }

            /* Responsive Glass Effects */
            @media (max-width: 768px) {
                .glass-morphism {
                    --glass-blur: 15px;
                }
                
                .glass-morphism .ytmusic-nav-bar,
                .glass-morphism .ytmusic-player-bar {
                    margin: 4px !important;
                    border-radius: 8px !important;
                }
            }

            /* High Contrast Mode Support */
            @media (prefers-contrast: high) {
                .glass-morphism {
                    --glass-border: rgba(255, 255, 255, 0.5);
                    --glass-text: rgba(255, 255, 255, 1);
                }
            }

            /* Reduced Motion Support */
            @media (prefers-reduced-motion: reduce) {
                .glass-morphism * {
                    animation: none !important;
                    transition: none !important;
                }
            }
        `;
    }

    getGlassAnimationScript() {
        return `
            // Add interactive glass effects
            function addGlassInteractivity() {
                // Add hover effects to all clickable elements
                const clickableElements = document.querySelectorAll('.yt-simple-endpoint, paper-button, .ytmusic-menu-item');
                
                clickableElements.forEach(element => {
                    element.addEventListener('mouseenter', function() {
                        this.style.animation = 'glassGlow 1s ease-in-out infinite';
                    });
                    
                    element.addEventListener('mouseleave', function() {
                        this.style.animation = 'none';
                    });
                });

                // Add dynamic background effects
                const body = document.body;
                let mouseX = 0, mouseY = 0;
                
                document.addEventListener('mousemove', function(e) {
                    mouseX = e.clientX / window.innerWidth;
                    mouseY = e.clientY / window.innerHeight;
                    
                    const hue = mouseX * 360;
                    const sat = 50 + mouseY * 30;
                    
                    body.style.setProperty('--glass-accent', \`hsla(\${hue}, \${sat}%, 60%, 0.9)\`);
                });

                console.log('✨ Glass interactivity initialized');
            }
            
            // Initialize after DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', addGlassInteractivity);
            } else {
                addGlassInteractivity();
            }
        `;
    }

    async disableGlassMorphism() {
        const mainWindow = appState.getMainWindow();
        if (!mainWindow) return;

        this.isGlassEnabled = false;

        await mainWindow.webContents.executeJavaScript(`
            (function() {
                try {
                    // Remove glass styles
                    const glassStyle = document.getElementById('glass-morphism-style');
                    if (glassStyle) {
                        glassStyle.remove();
                    }

                    // Remove glass classes
                    document.body.classList.remove('glass-morphism');
                    document.body.className = document.body.className.replace(/glass-\\w+/g, '');
                    
                    console.log('✨ Glass morphism disabled');
                } catch (error) {
                    console.error('Failed to disable glass morphism:', error);
                }
            })();
        `);

        // Reset window transparency
        mainWindow.setBackgroundColor('#0f0f0f');

        console.log('✨ Glass morphism UI disabled');
    }

    async setAnimationLevel(level) {
        this.animationLevel = level;
        const mainWindow = appState.getMainWindow();
        if (!mainWindow) return;

        const animationCSS = this.getAnimationLevelCSS(level);

        await mainWindow.webContents.executeJavaScript(`
            (function() {
                try {
                    // Remove existing animation level style
                    const existingStyle = document.getElementById('animation-level-style');
                    if (existingStyle) {
                        existingStyle.remove();
                    }

                    // Add new animation level style
                    const style = document.createElement('style');
                    style.id = 'animation-level-style';
                    style.textContent = \`${animationCSS}\`;
                    document.head.appendChild(style);

                    console.log('✨ Animation level set to: ${level}');
                } catch (error) {
                    console.error('Failed to set animation level:', error);
                }
            })();
        `);

        console.log(`✨ Animation level set to: ${level}`);
    }

    getAnimationLevelCSS(level) {
        const levels = {
            'none': `
                .glass-morphism * {
                    animation: none !important;
                    transition: none !important;
                }
            `,
            'minimal': `
                .glass-morphism * {
                    animation-duration: 0.1s !important;
                    transition-duration: 0.1s !important;
                }
            `,
            'medium': `
                .glass-morphism * {
                    animation-duration: 0.3s !important;
                    transition-duration: 0.3s !important;
                }
            `,
            'full': `
                .glass-morphism * {
                    animation-duration: 0.6s !important;
                    transition-duration: 0.6s !important;
                }
                
                .glass-morphism .ytmusic-player-bar {
                    animation: glassFloat 4s ease-in-out infinite !important;
                }
                
                .glass-morphism .yt-simple-endpoint:hover {
                    animation: glassGlow 1s ease-in-out infinite !important;
                }
            `
        };

        return levels[level] || levels['medium'];
    }

    getAvailableThemes() {
        return [
            { id: 'glass-dark', name: 'Glass Dark', description: 'Dark theme with glass effects' },
            { id: 'glass-light', name: 'Glass Light', description: 'Light theme with glass effects' },
            { id: 'glass-purple', name: 'Glass Purple', description: 'Purple theme with glass effects' },
            { id: 'glass-blue', name: 'Glass Blue', description: 'Blue theme with glass effects' }
        ];
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    isEnabled() {
        return this.isGlassEnabled;
    }

    getStatus() {
        return {
            enabled: this.isGlassEnabled,
            theme: this.currentTheme,
            animationLevel: this.animationLevel
        };
    }
}

module.exports = UIEnhancer;
