/**
 * Audio Enhancement Module
 */

const appState = require('../utils/state');

class AudioEnhancer {
    constructor() {
        this.equalizer = null;
        this.visualizer = null;
        this.audioNormalizer = null;
    }

    setupEqualizer() {
        const settings = appState.getSettings();
        const mainWindow = appState.getMainWindow();
        
        if (!mainWindow) return;
        
        mainWindow.webContents.executeJavaScript(`
            (function() {
                try {
                    // Create audio context if not exists
                    if (!window.audioContext) {
                        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    }

                    // Create equalizer if not exists
                    if (!window.equalizer) {
                        const context = window.audioContext;
                        window.equalizer = {
                            context: context,
                            filters: []
                        };

                        // Create bandpass filters for each frequency
                        const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
                        const eqSettings = {
                            60: ${settings.eq60 || 0},
                            170: ${settings.eq170 || 0},
                            310: ${settings.eq310 || 0},
                            600: ${settings.eq600 || 0},
                            1000: ${settings.eq1k || 0},
                            3000: ${settings.eq3k || 0},
                            6000: ${settings.eq6k || 0},
                            12000: ${settings.eq12k || 0},
                            14000: ${settings.eq14k || 0},
                            16000: ${settings.eq16k || 0}
                        };

                        frequencies.forEach((freq, index) => {
                            const filter = context.createBiquadFilter();
                            filter.type = 'peaking';
                            filter.frequency.value = freq;
                            filter.Q.value = 1;
                            filter.gain.value = eqSettings[freq] || 0;
                            window.equalizer.filters.push(filter);
                        });

                        console.log('🎛️ Audio equalizer initialized with', window.equalizer.filters.length, 'bands');
                    }
                } catch (error) {
                    console.error('Failed to setup equalizer:', error);
                }
            })();
        `).catch(error => {
            console.error('Error executing equalizer setup script:', error);
        });
        
        console.log('🎛️ Equalizer setup initiated');
    }

    disableEqualizer() {
        const mainWindow = appState.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript(`
                if (window.equalizer && window.equalizer.filters) {
                    window.equalizer.filters.forEach(filter => {
                        try {
                            filter.disconnect();
                        } catch (e) {}
                    });
                    window.equalizer = null;
                    console.log('❌ Equalizer disabled');
                }
            `);
        }
    }

    setupVisualizer() {
        const mainWindow = appState.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript(`
                (function() {
                    try {
                        if (!window.visualizer && window.audioContext) {
                            window.visualizer = {
                                analyser: window.audioContext.createAnalyser(),
                                canvas: null,
                                animationId: null
                            };
                            
                            window.visualizer.analyser.fftSize = 256;
                            console.log('🎨 Audio visualizer initialized');
                        }
                    } catch (error) {
                        console.error('Failed to setup visualizer:', error);
                    }
                })();
            `);
        }
        console.log('🎨 Visualizer setup initiated');
    }

    disableVisualizer() {
        const mainWindow = appState.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript(`
                if (window.visualizer) {
                    if (window.visualizer.animationId) {
                        cancelAnimationFrame(window.visualizer.animationId);
                    }
                    if (window.visualizer.analyser) {
                        window.visualizer.analyser.disconnect();
                    }
                    window.visualizer = null;
                    console.log('❌ Visualizer disabled');
                }
            `);
        }
    }

    applyAudioNormalization(enabled) {
        const mainWindow = appState.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript(`
                (function() {
                    try {
                        if (${enabled}) {
                            if (!window.audioNormalizer && window.audioContext) {
                                window.audioNormalizer = window.audioContext.createDynamicsCompressor();
                                window.audioNormalizer.threshold.value = -24;
                                window.audioNormalizer.knee.value = 30;
                                window.audioNormalizer.ratio.value = 12;
                                window.audioNormalizer.attack.value = 0.003;
                                window.audioNormalizer.release.value = 0.25;
                                console.log('🔊 Audio normalization enabled');
                            }
                        } else {
                            if (window.audioNormalizer) {
                                window.audioNormalizer.disconnect();
                                window.audioNormalizer = null;
                                console.log('🔊 Audio normalization disabled');
                            }
                        }
                    } catch (error) {
                        console.error('Failed to apply audio normalization:', error);
                    }
                })();
            `);
        }
    }

    applyCrossfade(enabled) {
        const mainWindow = appState.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript(`
                (function() {
                    try {
                        if (${enabled}) {
                            window.crossfadeEnabled = true;
                            console.log('🎵 Crossfade enabled');
                        } else {
                            window.crossfadeEnabled = false;
                            console.log('🎵 Crossfade disabled');
                        }
                    } catch (error) {
                        console.error('Failed to apply crossfade:', error);
                    }
                })();
            `);
        }
    }

    applyGaplessPlayback(enabled) {
        const mainWindow = appState.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript(`
                (function() {
                    try {
                        if (${enabled}) {
                            window.gaplessPlaybackEnabled = true;
                            console.log('🎵 Gapless playback enabled');
                        } else {
                            window.gaplessPlaybackEnabled = false;
                            console.log('🎵 Gapless playback disabled');
                        }
                    } catch (error) {
                        console.error('Failed to apply gapless playback:', error);
                    }
                })();
            `);
        }
    }

    applyBassBoost(level) {
        const mainWindow = appState.getMainWindow();
        if (mainWindow && level > 0) {
            mainWindow.webContents.executeJavaScript(`
                (function() {
                    try {
                        if (!window.bassBooster && window.audioContext) {
                            window.bassBooster = window.audioContext.createBiquadFilter();
                            window.bassBooster.type = 'lowshelf';
                            window.bassBooster.frequency.value = 320;
                            window.bassBooster.gain.value = ${level};
                            console.log('🔊 Bass boost set to ${level}dB');
                        }
                    } catch (error) {
                        console.error('Failed to apply bass boost:', error);
                    }
                })();
            `);
        }
    }

    updateEqualizerBand(band, value) {
        const mainWindow = appState.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript(`
                (function() {
                    try {
                        if (window.equalizer && window.equalizer.filters) {
                            const bandIndex = {
                                'eq60': 0, 'eq170': 1, 'eq310': 2, 'eq600': 3, 'eq1k': 4,
                                'eq3k': 5, 'eq6k': 6, 'eq12k': 7, 'eq14k': 8, 'eq16k': 9
                            }['${band}'];
                            
                            if (bandIndex !== undefined && window.equalizer.filters[bandIndex]) {
                                window.equalizer.filters[bandIndex].gain.value = ${value};
                                console.log('🎛️ Updated EQ band ${band} to ${value}dB');
                            }
                        }
                    } catch (error) {
                        console.error('Failed to update equalizer band:', error);
                    }
                })();
            `);
        }
    }
}

module.exports = AudioEnhancer;
