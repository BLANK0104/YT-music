/**
 * GitHub Release Description Generator
 * This file generates the release notes for automatic GitHub releases
 */

const fs = require('fs');
const path = require('path');

class ReleaseDescriptionGenerator {
    constructor() {
        this.packageJson = this.loadPackageJson();
        this.config = this.loadConfig();
        this.version = this.packageJson.version;
        this.appName = this.packageJson.productName || this.packageJson.name || this.config.app.name;
    }

    loadPackageJson() {
        try {
            const packagePath = path.join(__dirname, '..', 'package.json');
            return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        } catch (error) {
            console.error('Error loading package.json:', error);
            return { version: '1.0.0', name: 'YouTube Music Desktop' };
        }
    }

    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'release-config.json');
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            console.error('Error loading release config:', error);
            // Return default config if file not found
            return {
                app: { name: 'YouTube Music Desktop', subtitle: 'Glass UI Edition' },
                features: { main: [], latest: [] },
                installation: { instructions: [] },
                quickStart: [],
                themes: [],
                performance: [],
                systemRequirements: { minimum: [], recommended: [] }
            };
        }
    }

    getMainFeatures() {
        return this.config.features.main || [
            '🎨 **Glass Morphism UI** - Beautiful transparent effects with 4 stunning themes',
            '🎵 **Continuous Playback** - Automatic inactivity bypass',
            '🚫 **Advanced Ad Blocking** - Network-level and CSS-based ad removal'
        ];
    }

    getLatestChanges() {
        return this.config.features.latest || [
            '✨ Glass morphism UI is now the default interface',
            '🎵 Inactivity bypass prevents listening interruptions',
            '🏗️ Complete modular architecture for better performance'
        ];
    }

    getInstallationInstructions() {
        return this.config.installation.instructions || [
            '1. Download the `.exe` file below',
            '2. Run the installer',
            '3. Launch and enjoy!'
        ];
    }

    getSystemRequirements() {
        return this.config.systemRequirements || {
            minimum: ['Windows 10/11', '4GB RAM'],
            recommended: ['Windows 11', '8GB RAM']
        };
    }

    getQuickStartGuide() {
        return this.config.quickStart || [
            '🎨 Access Glass Themes: View → Glass Effects',
            '🎵 Continuous Play: Enabled by default'
        ];
    }

    generateDescription(commitData = {}) {
        const {
            sha = 'latest',
            timestamp = new Date().toISOString(),
            message = 'Latest updates and improvements'
        } = commitData;

        const description = `🎵 **${this.appName} - ${this.config.app.subtitle} v${this.version}**

**✨ ${this.config.app.description}**

## 📥 Download & Install

**Quick Install:** Download \`${this.appName} Setup ${this.version}.exe\` below and run it!

**File Size:** ${this.config.installation.fileSize} | **Platform:** ${this.config.installation.platform}

## ✨ Key Features

${this.getMainFeatures().map(feature => `- ${feature}`).join('\n')}

## 🆕 What's New in v${this.version}

${this.getLatestChanges().map(change => `- ${change}`).join('\n')}

## 🚀 Quick Start Guide

${this.getQuickStartGuide().map(step => `- ${step}`).join('\n')}

## 📋 Installation Instructions

${this.getInstallationInstructions().map((step, index) => `${index + 1}. ${step}`).join('\n')}

## 💻 System Requirements

### Minimum Requirements
${this.getSystemRequirements().minimum.map(req => `- ${req}`).join('\n')}

### Recommended for Best Experience  
${this.getSystemRequirements().recommended.map(req => `- ${req}`).join('\n')}

## 🎨 Glass UI Themes

Choose from beautiful themes in **View → Glass Effects**:
${this.config.themes.map(theme => `- **${theme.icon} ${theme.name}** - ${theme.description}`).join('\n')}

## ⚡ Performance Options

Customize animations in **View → Animations**:
${this.config.performance.map(perf => `- **${perf.level}** - ${perf.description}`).join('\n')}

## 🎵 No More Interruptions!

**Continuous Playback** is enabled by default - enjoy hours of uninterrupted music without "Are you still listening?" popups!

## 🔧 Need Help?

- **Documentation:** ${this.config.help.documentation}
- **Settings:** ${this.config.help.settings}
- **Themes:** ${this.config.help.themes}
- **Audio:** ${this.config.help.audio}
- **Mini Player:** ${this.config.help.miniPlayer}

## 📊 Build Information

- **Version:** ${this.version}
- **Build Date:** ${new Date(timestamp).toLocaleDateString()}
- **Commit:** ${sha.substring(0, 7)}
- **Commit Message:** "${message}"
- **Architecture:** Modular design with Glass UI

---

**🎉 Enjoy your enhanced YouTube Music experience with beautiful glass effects and uninterrupted playback!**

*No account required for download - just install and enjoy!*`;

        return description;
    }

    // Generate description for GitHub Actions
    generateForGitHub(githubContext = {}) {
        const commitData = {
            sha: githubContext.sha || process.env.GITHUB_SHA || 'latest',
            timestamp: githubContext.timestamp || new Date().toISOString(),
            message: githubContext.message || 'Latest updates and improvements'
        };

        return this.generateDescription(commitData);
    }

    // Save description to file (useful for debugging)
    saveToFile(filename = 'release-description.md') {
        const description = this.generateDescription();
        fs.writeFileSync(filename, description, 'utf8');
        console.log(`Release description saved to ${filename}`);
        return description;
    }

    // Output for GitHub Actions
    outputForActions() {
        const description = this.generateForGitHub({
            sha: process.env.GITHUB_SHA,
            timestamp: process.env.GITHUB_EVENT_HEAD_COMMIT_TIMESTAMP,
            message: process.env.GITHUB_EVENT_HEAD_COMMIT_MESSAGE
        });

        // Escape special characters for GitHub Actions
        const escapedDescription = description
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');

        console.log('RELEASE_DESCRIPTION<<EOF');
        console.log(description);
        console.log('EOF');

        return description;
    }
}

// Export for use in other modules
module.exports = ReleaseDescriptionGenerator;

// If run directly, output for GitHub Actions
if (require.main === module) {
    const generator = new ReleaseDescriptionGenerator();
    generator.outputForActions();
}
