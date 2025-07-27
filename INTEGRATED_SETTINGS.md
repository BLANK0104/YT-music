# Integrated Settings Menu

## Overview
Instead of a separate settings popup window, all relevant settings are now integrated directly into the application's navigation bar menu. This provides easier access to commonly used settings without the need to open a separate window.

## Settings Organization

### 1. System Integration
Located under **YouTube Music > Settings > System Integration**
- **System Tray**: Enable/disable system tray integration
- **Start with Windows**: Auto-start application with Windows
- **Global Media Keys**: Enable/disable global media key shortcuts

### 2. Audio & Playback  
Located under **YouTube Music > Settings > Audio & Playback**
- **Background Playback**: Continue playback when app is minimized
- **Audio Normalization**: Normalize audio levels across tracks
- **Gapless Playback**: Seamless transition between tracks
- **Crossfade**: Fade between tracks
- **Equalizer**: Enable/disable audio equalizer

### 3. Interface & Visual
Located under **YouTube Music > Settings > Interface & Visual**
- **Desktop Notifications**: Show track change notifications
- **Animated Background**: Enable background animations
- **Custom Themes**: Enable custom theme support
- **Visualizer**: Enable audio visualizer

### 4. External Services
Located under **YouTube Music > Settings > External Services**
- **Discord Rich Presence**: Show current track in Discord
- **Last.fm Scrobbling**: Scrobble tracks to Last.fm

## Features

### Real-time Changes
- Settings are applied immediately when toggled
- No need to restart the application
- Menu checkboxes reflect current setting states

### Smart Validation
- Last.fm scrobbling checks for API credentials
- Shows setup dialog if credentials are missing
- Automatically disables features if dependencies are unavailable

### Persistent Settings
- All settings are automatically saved to storage
- Settings persist between application restarts
- Menu reflects saved settings on startup

### Advanced Settings
- **Advanced Settings** option still available for complex configurations
- Opens the full settings window for detailed tweaking
- Equalizer band adjustments, API keys, etc.

## Benefits

### User Experience
- ✅ Quick access to common settings
- ✅ No popup windows cluttering the interface
- ✅ Visual feedback with checkboxes
- ✅ Immediate setting application

### Developer Experience
- ✅ Centralized setting management
- ✅ Automatic menu refresh on changes
- ✅ Consistent setting validation
- ✅ Easy to extend with new settings

## Usage Examples

### Enable System Tray
1. Click **YouTube Music** in menu bar
2. Navigate to **Settings > System Integration**
3. Check **System Tray**
4. Tray icon appears immediately

### Configure Audio
1. Click **YouTube Music** in menu bar
2. Navigate to **Settings > Audio & Playback**
3. Toggle desired audio features
4. Changes apply instantly

### Setup External Services
1. Click **YouTube Music** in menu bar
2. Navigate to **Settings > External Services**
3. Enable **Discord Rich Presence** or **Last.fm Scrobbling**
4. Follow setup dialogs if needed

## Technical Implementation

### Menu Structure
```javascript
YouTube Music
├── About
├── Settings
│   ├── System Integration
│   │   ├── System Tray
│   │   ├── Start with Windows
│   │   └── Global Media Keys
│   ├── Audio & Playback
│   │   ├── Background Playback
│   │   ├── Audio Normalization
│   │   ├── Gapless Playback
│   │   ├── Crossfade
│   │   └── Equalizer
│   ├── Interface & Visual
│   │   ├── Desktop Notifications
│   │   ├── Animated Background
│   │   ├── Custom Themes
│   │   └── Visualizer
│   ├── External Services
│   │   ├── Discord Rich Presence
│   │   └── Last.fm Scrobbling
│   └── Advanced Settings
├── Hide YouTube Music
└── Quit YouTube Music
```

### Setting Application Flow
1. User clicks menu item checkbox
2. Setting value updated in store
3. `applySettingChange()` function called
4. Feature enabled/disabled immediately
5. Menu refreshed to show new state

This approach makes the application more user-friendly by providing immediate access to settings without interrupting the music listening experience.
