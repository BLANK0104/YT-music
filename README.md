# YouTube Music Desktop

A cross-platform desktop application for YouTube Music with built-in ad blocking and enhanced features.

## Features

🎵 **Full YouTube Music Experience**
- Complete access to YouTube Music's web interface
- Google account login and synchronization
- All premium and free features supported

🚫 **Advanced Ad Blocking**
- Network-level ad request blocking
- CSS-based ad element removal
- Automatic removal of premium upgrade prompts
- Dynamic ad content filtering

🖥️ **Native Desktop Integration**
- Native window controls and menus
- Keyboard shortcuts for media controls
- System tray integration (planned)
- Cross-platform support (Windows, macOS, Linux)

🔒 **Enhanced Security & Privacy**
- Secure context isolation
- Protected external link handling
- No data tracking beyond YouTube Music
- Content Security Policy implementation

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Development Setup

1. **Clone or download the project**
   ```bash
   cd "path/to/your/project"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   # Build for current platform
   npm run build
   
   # Platform-specific builds
   npm run build:win    # Windows
   npm run build:mac    # macOS
   npm run build:linux  # Linux
   ```

## Usage

### Starting the Application
```bash
npm start
```

The application will launch and load YouTube Music. You can sign in with your Google account to access your library, playlists, and preferences.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + R` | Reload page |
| `F12` | Toggle Developer Tools |
| `F11` | Toggle Fullscreen |
| `Ctrl/Cmd + Q` | Quit application |
| `Ctrl/Cmd + 0` | Reset zoom |
| `Ctrl/Cmd + Plus` | Zoom in |
| `Ctrl/Cmd + Minus` | Zoom out |

### Menu Options

**File Menu**
- Reload page
- Toggle Developer Tools
- Quit application

**Edit Menu**
- Standard editing commands (Cut, Copy, Paste, etc.)

**View Menu**
- Zoom controls
- Fullscreen toggle

**Navigation Menu**
- Quick access to Home, Library, and Explore sections

## Ad Blocking Features

The application implements multiple layers of ad blocking:

### Network Level Blocking
- Blocks requests to known ad domains
- Filters YouTube-specific ad endpoints
- Prevents tracking and analytics requests

### Content Filtering
- Removes ad elements from the page
- Hides premium upgrade prompts
- Eliminates interruption overlays

### Dynamic Protection
- Monitors page changes for new ad content
- Automatically removes ads as they appear
- Maintains ad-free experience during navigation

## Configuration

### Custom Ad Blocking Rules

You can modify the ad blocking rules in `main.js`:

```javascript
// Add new domains to block
const adBlockingRules = [
    '*://*.doubleclick.net/*',
    '*://*.googlesyndication.com/*',
    // Add your custom rules here
];

// Add new CSS selectors to hide
const adBlockingCSS = `
    .your-custom-ad-selector {
        display: none !important;
    }
`;
```

## Development

### Project Structure
```
youtube-music-desktop/
├── main.js              # Main Electron process
├── preload.js           # Secure bridge script
├── index.html           # Splash screen
├── package.json         # Project configuration
├── assets/              # Icons and resources
├── .github/             # GitHub configuration
│   └── copilot-instructions.md
└── README.md           # This file
```

### Key Files

- **`main.js`**: Main Electron process handling window management, ad blocking, and application lifecycle
- **`preload.js`**: Secure communication bridge with YouTube Music integration APIs
- **`index.html`**: Application splash screen and fallback page

### Security Considerations

This application follows Electron security best practices:

- Context isolation enabled
- Node integration disabled in renderer
- Secure preload script implementation
- Content Security Policy headers
- External link protection

## Building and Distribution

### Building for Distribution

```bash
# Create distributable packages
npm run dist

# Create unpacked directory (for testing)
npm run pack
```

### Build Artifacts

The built applications will be available in the `dist/` directory:

- **Windows**: `.exe` installer and portable `.exe`
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage` portable application

## Troubleshooting

### Common Issues

**Application won't start**
- Ensure Node.js and npm are properly installed
- Run `npm install` to install dependencies
- Check for any error messages in the terminal

**Ad blocking not working**
- Clear browser cache and restart the application
- Check if YouTube Music has updated their ad implementation
- Update ad blocking rules if necessary

**Login issues**
- Ensure you have a stable internet connection
- Try clearing application data and logging in again
- Check if Google services are accessible

### Development Mode

For debugging, run the application in development mode:

```bash
npm run dev
```

This enables:
- Detailed logging
- Developer tools access
- Hot reload capabilities

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for:

- Bug fixes
- Feature enhancements
- Ad blocking improvements
- Cross-platform compatibility
- Documentation updates

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Disclaimer

This application is not affiliated with YouTube, Google, or Alphabet Inc. It is an independent desktop client that provides access to YouTube Music's web interface with additional features for user convenience.

The ad blocking functionality is provided for user experience enhancement and does not interfere with YouTube Music's core functionality or content delivery.

## Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing issues in the project repository
3. Create a new issue with detailed information about your problem
4. Include your operating system, Node.js version, and error messages

---

**Enjoy your ad-free YouTube Music experience! 🎵**
