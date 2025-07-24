/**
 * Integration example for main.js
 * This shows how to use the advanced ad blocker in your Electron app
 */

const AdvancedAdBlocker = require('./advanced-adblocker');

// Initialize the advanced ad blocker
const adBlocker = new AdvancedAdBlocker();

async function setupAdvancedAdBlocking() {
    console.log('🛡️ Setting up advanced ad blocking with uBlock Origin filters...');
    
    // Initialize with filter lists
    await adBlocker.initialize();
    
    // Set up network request interception
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
        // Use the same logic as uBlock Origin
        if (adBlocker.shouldBlockRequest(details.url)) {
            console.log('🚫 Blocked (uBlock filter):', details.url);
            callback({ cancel: true });
        } else {
            callback({});
        }
    });

    // Inject cosmetic filters (CSS hiding)
    session.defaultSession.webRequest.onCompleted((details) => {
        if (details.url.includes('music.youtube.com')) {
            const cosmeticFilters = adBlocker.getCosmeticFilters('music.youtube.com');
            
            if (cosmeticFilters.length > 0) {
                mainWindow.webContents.insertCSS(`
                    ${cosmeticFilters.join(', ')} {
                        display: none !important;
                    }
                `);
            }
        }
    });
}

// Use in your createWindow function:
// await setupAdvancedAdBlocking();
