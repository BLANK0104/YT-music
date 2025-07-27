/**
 * YouTube Inactivity Bypass Module
 * Prevents "Are you still listening?" popup for continuous music playback
 */

const appState = require('../utils/state');

class InactivityBypass {
    constructor() {
        this.isEnabled = true;
        this.lastActivity = Date.now();
        this.activityInterval = null;
        this.popupCheckInterval = null;
        this.simulationMethods = ['mouse', 'keyboard', 'scroll'];
        this.currentMethod = 0;
    }

    initialize() {
        console.log('🎵 Initializing YouTube inactivity bypass...');
        
        // Start monitoring and prevention
        this.startActivitySimulation();
        this.startPopupMonitoring();
        
        console.log('✅ Inactivity bypass enabled - continuous playback ready');
    }

    startActivitySimulation() {
        // Simulate user activity every 4 minutes (YouTube timeout is usually 5-6 minutes)
        this.activityInterval = setInterval(() => {
            if (this.isEnabled && this.shouldSimulateActivity()) {
                this.simulateUserActivity();
            }
        }, 4 * 60 * 1000); // 4 minutes
    }

    startPopupMonitoring() {
        // Check for inactivity popup every 30 seconds
        this.popupCheckInterval = setInterval(() => {
            if (this.isEnabled) {
                this.checkAndDismissPopup();
            }
        }, 30 * 1000); // 30 seconds
    }

    shouldSimulateActivity() {
        const mainWindow = appState.getMainWindow();
        if (!mainWindow) return false;

        // Only simulate if music is playing
        const currentTrack = appState.getCurrentTrack();
        return currentTrack && currentTrack.isPlaying;
    }

    async simulateUserActivity() {
        const mainWindow = appState.getMainWindow();
        if (!mainWindow) return;

        const method = this.simulationMethods[this.currentMethod];
        this.currentMethod = (this.currentMethod + 1) % this.simulationMethods.length;

        try {
            await mainWindow.webContents.executeJavaScript(`
                (function() {
                    try {
                        const method = '${method}';
                        
                        switch(method) {
                            case 'mouse':
                                // Simulate tiny mouse movement
                                const mouseEvent = new MouseEvent('mousemove', {
                                    bubbles: true,
                                    cancelable: true,
                                    clientX: Math.random() * 10 + 100,
                                    clientY: Math.random() * 10 + 100
                                });
                                document.dispatchEvent(mouseEvent);
                                break;
                                
                            case 'keyboard':
                                // Simulate key activity (non-interfering)
                                const keyEvent = new KeyboardEvent('keydown', {
                                    key: 'Control',
                                    ctrlKey: true,
                                    bubbles: true
                                });
                                document.dispatchEvent(keyEvent);
                                
                                setTimeout(() => {
                                    const keyUpEvent = new KeyboardEvent('keyup', {
                                        key: 'Control',
                                        ctrlKey: false,
                                        bubbles: true
                                    });
                                    document.dispatchEvent(keyUpEvent);
                                }, 50);
                                break;
                                
                            case 'scroll':
                                // Simulate minimal scroll activity
                                const scrollEvent = new WheelEvent('wheel', {
                                    deltaY: 1,
                                    bubbles: true,
                                    cancelable: true
                                });
                                document.dispatchEvent(scrollEvent);
                                
                                setTimeout(() => {
                                    const scrollBackEvent = new WheelEvent('wheel', {
                                        deltaY: -1,
                                        bubbles: true,
                                        cancelable: true
                                    });
                                    document.dispatchEvent(scrollBackEvent);
                                }, 100);
                                break;
                        }
                        
                        console.log('🎵 Simulated user activity (' + method + ') to prevent inactivity popup');
                        return true;
                        
                    } catch (error) {
                        console.error('Failed to simulate activity:', error);
                        return false;
                    }
                })();
            `);

            this.lastActivity = Date.now();
            console.log(`🎵 Simulated ${method} activity to maintain session`);

        } catch (error) {
            console.error('Error simulating user activity:', error);
        }
    }

    async checkAndDismissPopup() {
        const mainWindow = appState.getMainWindow();
        if (!mainWindow) return;

        try {
            const popupFound = await mainWindow.webContents.executeJavaScript(`
                (function() {
                    try {
                        // Look for various YouTube inactivity popup selectors
                        const popupSelectors = [
                            '[aria-label*="still listening"]',
                            '[aria-label*="Still there"]',
                            'tp-yt-paper-dialog[aria-label*="confirm"]',
                            '.ytmusic-you-there-renderer',
                            '[data-title*="still listening"]',
                            'ytmusic-confirm-dialog-renderer',
                            '.style-scope.ytmusic-confirm-dialog-renderer',
                            '[role="dialog"][aria-modal="true"]'
                        ];
                        
                        let popup = null;
                        let popupType = 'unknown';
                        
                        for (const selector of popupSelectors) {
                            const element = document.querySelector(selector);
                            if (element && element.offsetParent !== null) {
                                popup = element;
                                popupType = selector;
                                break;
                            }
                        }
                        
                        if (popup) {
                            // Look for continue/yes/confirm buttons
                            const buttonSelectors = [
                                'tp-yt-paper-button[aria-label*="Yes"]',
                                'tp-yt-paper-button[aria-label*="Continue"]',
                                'tp-yt-paper-button[aria-label*="Keep"]',
                                '.ytmusic-button-renderer[aria-label*="Yes"]',
                                '.ytmusic-button-renderer[aria-label*="Continue"]',
                                'button[aria-label*="Yes"]',
                                'button[aria-label*="Continue"]',
                                '[role="button"]:not([aria-label*="No"]):not([aria-label*="Cancel"])'
                            ];
                            
                            let confirmButton = null;
                            
                            for (const buttonSelector of buttonSelectors) {
                                const buttons = popup.querySelectorAll(buttonSelector);
                                for (const button of buttons) {
                                    const text = button.textContent?.toLowerCase() || '';
                                    const label = button.getAttribute('aria-label')?.toLowerCase() || '';
                                    
                                    if (text.includes('yes') || text.includes('continue') || text.includes('keep') ||
                                        label.includes('yes') || label.includes('continue') || label.includes('keep')) {
                                        confirmButton = button;
                                        break;
                                    }
                                }
                                if (confirmButton) break;
                            }
                            
                            if (confirmButton && confirmButton.offsetParent !== null) {
                                // Click the continue button
                                confirmButton.click();
                                console.log('🎵 Automatically dismissed inactivity popup');
                                return { found: true, dismissed: true, type: popupType };
                            } else {
                                console.warn('🎵 Inactivity popup found but no continue button located');
                                return { found: true, dismissed: false, type: popupType };
                            }
                        }
                        
                        return { found: false, dismissed: false };
                        
                    } catch (error) {
                        console.error('Error checking for inactivity popup:', error);
                        return { found: false, dismissed: false, error: error.message };
                    }
                })();
            `);

            if (popupFound.found) {
                if (popupFound.dismissed) {
                    console.log('✅ Successfully dismissed YouTube inactivity popup');
                } else {
                    console.warn('⚠️ Inactivity popup detected but could not dismiss automatically');
                    // Try alternative dismissal method
                    this.tryAlternativeDismissal();
                }
            }

        } catch (error) {
            console.error('Error checking for inactivity popup:', error);
        }
    }

    async tryAlternativeDismissal() {
        const mainWindow = appState.getMainWindow();
        if (!mainWindow) return;

        try {
            await mainWindow.webContents.executeJavaScript(`
                (function() {
                    try {
                        // Try pressing Enter key to dismiss
                        const enterEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            keyCode: 13,
                            bubbles: true,
                            cancelable: true
                        });
                        document.dispatchEvent(enterEvent);
                        
                        // Also try clicking anywhere on the document
                        setTimeout(() => {
                            const clickEvent = new MouseEvent('click', {
                                bubbles: true,
                                cancelable: true,
                                clientX: window.innerWidth / 2,
                                clientY: window.innerHeight / 2
                            });
                            document.dispatchEvent(clickEvent);
                        }, 500);
                        
                        console.log('🎵 Attempted alternative popup dismissal methods');
                        return true;
                        
                    } catch (error) {
                        console.error('Alternative dismissal failed:', error);
                        return false;
                    }
                })();
            `);

        } catch (error) {
            console.error('Error in alternative dismissal:', error);
        }
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        const settings = appState.getSettings();
        settings.inactivityBypass = enabled;
        appState.setSettings(settings);

        if (enabled) {
            if (!this.activityInterval) {
                this.startActivitySimulation();
            }
            if (!this.popupCheckInterval) {
                this.startPopupMonitoring();
            }
            console.log('✅ Inactivity bypass enabled');
        } else {
            if (this.activityInterval) {
                clearInterval(this.activityInterval);
                this.activityInterval = null;
            }
            if (this.popupCheckInterval) {
                clearInterval(this.popupCheckInterval);
                this.popupCheckInterval = null;
            }
            console.log('❌ Inactivity bypass disabled');
        }
    }

    isActive() {
        return this.isEnabled && this.activityInterval !== null;
    }

    getStatus() {
        return {
            enabled: this.isEnabled,
            active: this.isActive(),
            lastActivity: this.lastActivity,
            timeSinceLastActivity: Date.now() - this.lastActivity,
            nextCheck: this.activityInterval ? 'Active' : 'Inactive'
        };
    }

    destroy() {
        if (this.activityInterval) {
            clearInterval(this.activityInterval);
            this.activityInterval = null;
        }
        if (this.popupCheckInterval) {
            clearInterval(this.popupCheckInterval);
            this.popupCheckInterval = null;
        }
        console.log('🎵 Inactivity bypass destroyed');
    }
}

module.exports = InactivityBypass;
