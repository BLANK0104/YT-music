/**
 * Theme Management Module
 */

const appState = require('../utils/state');

class ThemeManager {
    constructor() {
        this.currentTheme = null;
        this.availableThemes = {
            dark: {
                name: 'Dark',
                colors: {
                    primary: '#0f0f0f',
                    secondary: '#1a1a1a',
                    accent: '#4ecdc4',
                    text: '#ffffff',
                    textSecondary: '#b3b3b3'
                }
            },
            light: {
                name: 'Light',
                colors: {
                    primary: '#ffffff',
                    secondary: '#f5f5f5',
                    accent: '#1976d2',
                    text: '#000000',
                    textSecondary: '#666666'
                }
            },
            purple: {
                name: 'Purple',
                colors: {
                    primary: '#1a0f1a',
                    secondary: '#2d1b2d',
                    accent: '#9c27b0',
                    text: '#ffffff',
                    textSecondary: '#d1c4e9'
                }
            },
            blue: {
                name: 'Blue',
                colors: {
                    primary: '#0f1419',
                    secondary: '#1e2a3a',
                    accent: '#2196f3',
                    text: '#ffffff',
                    textSecondary: '#bbdefb'
                }
            }
        };
    }

    applyCustomTheme(themeName = 'dark') {
        const theme = this.availableThemes[themeName];
        if (!theme) {
            console.warn(`Theme '${themeName}' not found, using dark theme`);
            themeName = 'dark';
        }

        const mainWindow = appState.getMainWindow();
        if (!mainWindow) return;

        this.currentTheme = themeName;
        appState.setSelectedTheme(themeName);

        const themeCSS = this.generateThemeCSS(this.availableThemes[themeName]);

        mainWindow.webContents.executeJavaScript(`
            (function() {
                try {
                    // Remove existing custom theme
                    const existingStyle = document.getElementById('custom-theme-style');
                    if (existingStyle) {
                        existingStyle.remove();
                    }

                    // Create new style element
                    const style = document.createElement('style');
                    style.id = 'custom-theme-style';
                    style.textContent = \`${themeCSS}\`;
                    document.head.appendChild(style);

                    // Add theme class to body
                    document.body.classList.add('custom-theme');
                    document.body.classList.add('theme-${themeName}');
                    
                    console.log('🎨 Applied custom theme: ${themeName}');
                } catch (error) {
                    console.error('Failed to apply custom theme:', error);
                }
            })();
        `).catch(error => {
            console.error('Error applying theme:', error);
        });

        console.log(`🎨 Theme '${themeName}' applied successfully`);
    }

    generateThemeCSS(theme) {
        return `
            /* Custom Theme: ${theme.name} */
            .custom-theme {
                --theme-primary: ${theme.colors.primary} !important;
                --theme-secondary: ${theme.colors.secondary} !important;
                --theme-accent: ${theme.colors.accent} !important;
                --theme-text: ${theme.colors.text} !important;
                --theme-text-secondary: ${theme.colors.textSecondary} !important;
            }

            /* Apply theme colors to YouTube Music elements */
            .custom-theme ytmusic-app,
            .custom-theme ytmusic-app-layout,
            .custom-theme #layout,
            .custom-theme #background {
                background-color: var(--theme-primary) !important;
                color: var(--theme-text) !important;
            }

            .custom-theme ytmusic-nav-bar,
            .custom-theme ytmusic-player-bar,
            .custom-theme .side-panel,
            .custom-theme .header {
                background-color: var(--theme-secondary) !important;
                color: var(--theme-text) !important;
            }

            .custom-theme .yt-simple-endpoint:hover,
            .custom-theme paper-button:hover,
            .custom-theme iron-icon:hover {
                background-color: var(--theme-accent) !important;
                color: var(--theme-primary) !important;
            }

            .custom-theme .title,
            .custom-theme .subtitle-1,
            .custom-theme .body-1 {
                color: var(--theme-text) !important;
            }

            .custom-theme .subtitle-2,
            .custom-theme .body-2,
            .custom-theme .byline {
                color: var(--theme-text-secondary) !important;
            }

            /* Custom scrollbars */
            .custom-theme ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }

            .custom-theme ::-webkit-scrollbar-track {
                background: var(--theme-secondary);
            }

            .custom-theme ::-webkit-scrollbar-thumb {
                background: var(--theme-accent);
                border-radius: 4px;
            }

            .custom-theme ::-webkit-scrollbar-thumb:hover {
                background: var(--theme-text-secondary);
            }
        `;
    }

    resetTheme() {
        const mainWindow = appState.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript(`
                (function() {
                    try {
                        // Remove custom theme style
                        const existingStyle = document.getElementById('custom-theme-style');
                        if (existingStyle) {
                            existingStyle.remove();
                        }

                        // Remove theme classes
                        document.body.classList.remove('custom-theme');
                        document.body.className = document.body.className.replace(/theme-\\w+/g, '');
                        
                        console.log('🎨 Custom themes reset to default');
                    } catch (error) {
                        console.error('Failed to reset theme:', error);
                    }
                })();
            `);
        }

        this.currentTheme = null;
        console.log('🎨 Theme reset to default');
    }

    getAvailableThemes() {
        return Object.keys(this.availableThemes).map(key => ({
            id: key,
            name: this.availableThemes[key].name,
            colors: this.availableThemes[key].colors
        }));
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    addCustomTheme(id, theme) {
        this.availableThemes[id] = theme;
        console.log(`🎨 Added custom theme: ${theme.name}`);
    }

    removeCustomTheme(id) {
        if (this.availableThemes[id] && !['dark', 'light', 'purple', 'blue'].includes(id)) {
            delete this.availableThemes[id];
            console.log(`🎨 Removed custom theme: ${id}`);
            return true;
        }
        return false;
    }
}

module.exports = ThemeManager;
