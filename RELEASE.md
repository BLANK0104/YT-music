# 🎵 YouTube Music Desktop - Release Ready!

## 📦 **Single File Executable Available**

**Download:** `YouTube Music Desktop-1.0.0-Portable.exe` (Located in `/dist` folder)

This is a **single portable executable** that requires no installation - just download and run!

---

## ✨ **Features Included**

### 🚫 **Advanced Ad Blocking**
- **Network-level blocking** of all YouTube ad domains
- **CSS-based removal** of premium upgrade prompts
- **Dynamic filtering** that removes ads as they appear
- **Background protection** against new ad types

### 🎵 **Full YouTube Music Experience**
- Complete access to YouTube Music web interface
- Google account login and sync
- All playlists, library, and recommendations
- High-quality audio streaming

### 🖥️ **Native Desktop Features**
- **System tray integration** - minimize to tray
- **Global media key support** (Play/Pause, Next, Previous)
- **Background playback** - music continues when minimized
- **Custom keyboard shortcuts**
- **Glass morphism UI effects** with beautiful animations

### ⚙️ **Advanced Settings**
- **Built-in equalizer** with 10-band frequency control
- **Hardware acceleration** toggle
- **Audio quality** settings
- **Visual effects** control
- **Startup behavior** customization

### 🔒 **Security & Privacy**
- **Secure context isolation** following Electron best practices
- **No data tracking** beyond YouTube Music
- **Safe external link handling**
- **Content Security Policy** protection

---

## 🎹 **Keyboard Shortcuts**

| Shortcut | Action |
|----------|--------|
| `Space` | Play/Pause |
| `Ctrl + →` | Next Track |
| `Ctrl + ←` | Previous Track |
| `Ctrl + ↑` | Volume Up |
| `Ctrl + ↓` | Volume Down |
| `Ctrl + 1` | Go to Home |
| `Ctrl + 2` | Go to Library |
| `Ctrl + 3` | Go to Explore |
| `Alt + M` | Show/Hide Window |
| `F11` | Toggle Fullscreen |
| `Ctrl + ,` | Open Settings |

---

## 🚀 **How to Use**

1. **Download** the `YouTube Music Desktop-1.0.0-Portable.exe` file
2. **Run** the executable (no installation required)
3. **Sign in** to your Google/YouTube account
4. **Enjoy** ad-free YouTube Music!

### 📱 **System Tray**
- App minimizes to system tray for background playback
- Right-click tray icon for quick controls
- Double-click to show/hide window

### ⚙️ **Settings Access**
- Use `Ctrl + ,` or go to File > Settings
- Customize equalizer, visual effects, and behavior
- Changes are saved automatically

---

## 🎨 **Beautiful Interface**

- **Glass morphism effects** with blur and transparency
- **Smooth animations** on all interactions
- **Custom scrollbars** and hover effects
- **Animated progress bars** with gradient colors
- **Enhanced YouTube Music branding** throughout

---

## 🔧 **Technical Details**

- **Built with:** Electron 37.2.4
- **Platform:** Windows (x64)
- **Size:** ~150MB portable executable
- **Requirements:** Windows 10/11
- **Memory:** ~200MB RAM usage
- **CPU:** Minimal background usage

---

## 🆘 **Troubleshooting**

### **App won't start**
- Make sure you have Windows 10/11
- Try running as administrator
- Check Windows Defender hasn't quarantined it

### **Audio issues**
- Check Windows audio settings
- Try toggling hardware acceleration in Settings
- Restart the app if audio cuts out

### **Login problems**
- Ensure stable internet connection
- Clear app data: Close app → Delete user data folder
- Try logging in through web browser first

### **Performance issues**
- Disable hardware acceleration in Settings
- Close other resource-intensive applications
- Check available RAM (app needs ~200MB)

---

## 📋 **For Developers**

### **Project Structure**
```
YouTube Music Desktop/
├── main.js              # Main Electron process
├── preload.js           # Secure bridge & YT Music integration
├── settings.html        # Settings window
├── package.json         # Build configuration
└── assets/             # Icons and resources
```

### **Build Commands**
```bash
npm start                # Run in development
npm run dev             # Development with logging
npm run build:portable # Build portable executable
npm run build:win      # Build Windows installer
```

### **Customization**
- **Ad blocking rules:** Edit `main.js` (adBlockingRules array)
- **UI styling:** Modify `enhancedCSS` in `main.js`
- **Settings:** Add new options in `settings.html`

---

## 📄 **License & Disclaimer**

**License:** MIT License

**Disclaimer:** This is an unofficial desktop client for YouTube Music. Not affiliated with Google/YouTube. The ad blocking functionality is provided for user experience enhancement and does not interfere with YouTube Music's core functionality.

---

## 🎉 **Enjoy Your Ad-Free YouTube Music Experience!**

**Single file download, zero installation hassle, maximum music enjoyment!**

For issues or suggestions, please report them in the project repository.
