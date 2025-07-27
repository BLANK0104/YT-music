const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIcons() {
    const assetsDir = path.join(__dirname, 'assets');
    
    // Read the SVG files
    const iconSvg = fs.readFileSync(path.join(assetsDir, 'icon.svg'), 'utf8');
    const trayIconSvg = fs.readFileSync(path.join(assetsDir, 'tray-icon.svg'), 'utf8');

    try {
        console.log('Creating icons...');
        
        // Create main icon PNG (512x512)
        await sharp(Buffer.from(iconSvg))
            .resize(512, 512)
            .png()
            .toFile(path.join(assetsDir, 'icon.png'));
        console.log('✓ icon.png created (512x512)');
        
        // Create tray icon PNG (32x32)
        await sharp(Buffer.from(trayIconSvg))
            .resize(32, 32)
            .png()
            .toFile(path.join(assetsDir, 'tray-icon.png'));
        console.log('✓ tray-icon.png created (32x32)');
        
        // Create Windows ICO file (multiple sizes)
        const ico256 = await sharp(Buffer.from(iconSvg))
            .resize(256, 256)
            .png()
            .toBuffer();
        
        const ico128 = await sharp(Buffer.from(iconSvg))
            .resize(128, 128)
            .png()
            .toBuffer();
            
        const ico64 = await sharp(Buffer.from(iconSvg))
            .resize(64, 64)
            .png()
            .toBuffer();
            
        const ico48 = await sharp(Buffer.from(iconSvg))
            .resize(48, 48)
            .png()
            .toBuffer();
            
        const ico32 = await sharp(Buffer.from(iconSvg))
            .resize(32, 32)
            .png()
            .toBuffer();
            
        const ico16 = await sharp(Buffer.from(iconSvg))
            .resize(16, 16)
            .png()
            .toBuffer();

        // For now, use the 256x256 version as ICO (electron-builder will handle conversion)
        fs.writeFileSync(path.join(assetsDir, 'icon.ico'), ico256);
        console.log('✓ icon.ico created (256x256 base)');
        
        // Create additional sizes for better compatibility
        await sharp(Buffer.from(iconSvg))
            .resize(256, 256)
            .png()
            .toFile(path.join(assetsDir, 'icon@2x.png'));
        console.log('✓ icon@2x.png created (256x256)');
            
        await sharp(Buffer.from(iconSvg))
            .resize(128, 128)
            .png()
            .toFile(path.join(assetsDir, 'icon@1x.png'));
        console.log('✓ icon@1x.png created (128x128)');
        
        console.log('🎉 All icons created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating icons:', error);
        
        // Fallback: create simple colored rectangles if Sharp fails
        console.log('Creating fallback icons...');
        
        const createFallbackIcon = (size, filename) => {
            // Create a simple red square as fallback
            const canvas = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <rect width="${size}" height="${size}" fill="#FF0000"/>
                <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-size="${size/8}">YTM</text>
            </svg>`;
            
            return sharp(Buffer.from(canvas))
                .png()
                .toFile(path.join(assetsDir, filename));
        };
        
        try {
            await createFallbackIcon(512, 'icon.png');
            await createFallbackIcon(32, 'tray-icon.png');
            await createFallbackIcon(256, 'icon.ico');
            console.log('✓ Fallback icons created');
        } catch (fallbackError) {
            console.error('❌ Even fallback failed:', fallbackError);
        }
    }
}

if (require.main === module) {
    createIcons();
}

module.exports = createIcons;
