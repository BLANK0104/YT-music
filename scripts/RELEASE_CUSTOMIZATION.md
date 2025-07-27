# 📝 Release Description Customization Guide

## Overview

The GitHub release descriptions are now automatically generated using JavaScript files, making them easy to customize and maintain.

## 📁 Files

### `scripts/release-description.js`
The main generator that creates the release description from configuration data.

### `scripts/release-config.json`
Configuration file containing all the text content, features, and settings for releases.

## 🛠️ How to Customize

### 1. Edit Basic App Information

```json
{
  "app": {
    "name": "YouTube Music Desktop",
    "subtitle": "Glass UI Edition", 
    "description": "Your custom description here!"
  }
}
```

### 2. Update Features Lists

```json
{
  "features": {
    "main": [
      "🎨 **Your Feature** - Description here",
      "🎵 **Another Feature** - More details"
    ],
    "latest": [
      "✨ Recent update 1",
      "🚀 Recent update 2"
    ]
  }
}
```

### 3. Modify Installation Instructions

```json
{
  "installation": {
    "fileSize": "~150MB installer",
    "platform": "Windows 10/11 (64-bit)",
    "instructions": [
      "Step 1 description",
      "Step 2 description"
    ]
  }
}
```

### 4. Customize Themes

```json
{
  "themes": [
    {
      "name": "Glass Dark",
      "icon": "🌙",
      "description": "Perfect for night listening"
    }
  ]
}
```

### 5. Update System Requirements

```json
{
  "systemRequirements": {
    "minimum": [
      "**OS:** Windows 10/11 (64-bit)",
      "**RAM:** 4GB minimum"
    ],
    "recommended": [
      "**OS:** Windows 11 (64-bit)", 
      "**RAM:** 8GB+ for optimal performance"
    ]
  }
}
```

## 🚀 Testing Locally

### Generate and Preview Release Description

```bash
# Navigate to scripts directory
cd scripts

# Generate description
node release-description.js

# Save to file for preview
node -e "
const Generator = require('./release-description.js');
const gen = new Generator();
gen.saveToFile('preview.md');
console.log('Preview saved to preview.md');
"
```

### Test with Custom Environment Variables

```bash
# Simulate GitHub Actions environment
set GITHUB_SHA=abc123def456
set GITHUB_EVENT_HEAD_COMMIT_MESSAGE=Added new feature
node release-description.js
```

## ⚙️ GitHub Actions Integration

The workflow automatically:

1. **Sets up Node.js** environment
2. **Runs the generator** with GitHub context
3. **Captures the output** as a GitHub Actions variable
4. **Uses the generated description** in the release

### Workflow Steps:

```yaml
- name: Generate release description
  id: release-description
  run: |
    cd scripts
    DESCRIPTION=$(node release-description.js)
    echo "RELEASE_DESCRIPTION<<EOF" >> $GITHUB_OUTPUT
    echo "$DESCRIPTION" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT

- name: Create automatic release
  uses: softprops/action-gh-release@v2
  with:
    body: ${{ steps.release-description.outputs.RELEASE_DESCRIPTION }}
```

## 🎨 Customization Examples

### Adding a New Feature Section

```json
{
  "features": {
    "main": [
      "🆕 **Your New Feature** - Amazing new functionality",
      "🎯 **Improved Performance** - 50% faster loading"
    ]
  }
}
```

### Changing the App Subtitle

```json
{
  "app": {
    "subtitle": "Professional Edition",
    "description": "The ultimate YouTube Music experience for professionals!"
  }
}
```

### Adding Custom Quick Start Tips

```json
{
  "quickStart": [
    "🎯 **Pro Tip:** Use Ctrl+Shift+M for advanced mini player",
    "🔥 **Power User:** Right-click anywhere for context menu"
  ]
}
```

### Updating Help Links

```json
{
  "help": {
    "documentation": "Visit our wiki at github.com/user/repo/wiki",
    "settings": "Press F1 or visit Settings → Help",
    "support": "Join our Discord server for live support"
  }
}
```

## 🔄 Automatic Updates

The system automatically includes:

- **Version number** from `package.json`
- **Build date** from GitHub Actions
- **Commit hash** from the triggering commit
- **Commit message** from the latest commit

## 📊 Advanced Customization

### Conditional Content

You can modify `release-description.js` to include conditional content:

```javascript
// Example: Different content for different versions
getLatestChanges() {
    const version = this.version;
    if (version.includes('beta')) {
        return ['🧪 Beta features and improvements'];
    }
    return this.config.features.latest;
}
```

### Dynamic Feature Detection

```javascript
// Example: Auto-detect features from codebase
async getDetectedFeatures() {
    // Scan src/ directory for feature modules
    // Return dynamically generated feature list
}
```

## 🎯 Best Practices

1. **Keep descriptions concise** but informative
2. **Use emojis consistently** for visual appeal
3. **Test locally** before pushing changes
4. **Update features** with each release
5. **Maintain consistent formatting** across sections

## 🚨 Troubleshooting

### Script Not Running
- Ensure Node.js is installed in GitHub Actions
- Check file paths are correct (`scripts/` directory)
- Verify JSON syntax in config file

### Missing Content
- Check `release-config.json` syntax
- Ensure all required fields are present
- Verify file permissions and accessibility

### GitHub Actions Errors
- Check workflow YAML syntax
- Ensure environment variables are passed correctly
- Verify GitHub token permissions

---

**💡 Pro Tip:** Keep the `release-config.json` file well-organized and document any custom changes for future reference!
