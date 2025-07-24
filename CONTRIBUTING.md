# Contributing to YouTube Music Desktop

Thank you for your interest in contributing to YouTube Music Desktop! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or later
- npm package manager
- Git for version control
- Basic knowledge of Electron and JavaScript

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/youtube-music-desktop.git`
3. Install dependencies: `npm install`
4. Start development: `npm run dev`

## 🏗️ Project Structure

```
├── main.js          # Main Electron process - window management, tray, ad blocking
├── preload.js       # Secure bridge - YouTube Music integration APIs
├── index.html       # Application splash screen
├── settings.html    # Settings interface with equalizer
├── assets/          # Icons and static resources
├── .github/         # GitHub Actions workflows
└── package.json     # Project configuration and build settings
```

## 🛠️ Development Guidelines

### Code Style
- Use semicolons
- Use camelCase for variables and functions
- Use PascalCase for classes
- Use meaningful variable names
- Add comments for complex logic

### Security Best Practices
- Always use `contextBridge` for renderer-main communication
- Implement proper CSP headers
- Validate all user inputs
- Use secure defaults for Electron options

### Ad Blocking Updates
- Update network blocking rules in `main.js`
- Update CSS selectors in `preload.js`
- Test on different YouTube Music pages
- Ensure no legitimate content is blocked

## 📝 Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (no logic changes)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(ad-blocking): add new ad selector patterns
fix(tray): resolve tray icon not showing on Windows
docs(readme): update installation instructions
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] App starts without errors
- [ ] YouTube Music loads correctly
- [ ] User login works
- [ ] Ad blocking is effective
- [ ] System tray functionality
- [ ] Background playback
- [ ] Equalizer controls
- [ ] Settings persistence
- [ ] Keyboard shortcuts
- [ ] Window management

### Testing on Different Pages
- [ ] Home page
- [ ] Search results
- [ ] Playlist pages
- [ ] Library section
- [ ] Now playing interface

## 🔄 Pull Request Process

1. **Create a feature branch**: `git checkout -b feature/your-feature-name`
2. **Make your changes** following the guidelines above
3. **Test thoroughly** using the manual testing checklist
4. **Update documentation** if needed
5. **Commit your changes** using the commit message format
6. **Push to your fork**: `git push origin feature/your-feature-name`
7. **Create a pull request** with a clear description

### Pull Request Template
```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Other (please describe)

## Testing
- [ ] Manual testing completed
- [ ] Works on Windows
- [ ] Works on macOS (if applicable)
- [ ] Works on Linux (if applicable)
- [ ] Ad blocking still effective
- [ ] No new console errors

## Screenshots (if applicable)
Add screenshots to help explain your changes

## Additional Notes
Any additional information about the changes
```

## 🐛 Bug Reports

When reporting bugs, please include:
- Operating system and version
- App version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Console error messages (if any)
- Screenshots (if helpful)

## 💡 Feature Requests

For feature requests, please provide:
- Clear description of the feature
- Use case or problem it solves
- Proposed implementation (if you have ideas)
- Any relevant mockups or examples

## 📋 Development Tasks

### Priority Areas
1. **Ad Blocking Improvements**
   - New ad patterns detection
   - Performance optimization
   - Compatibility with YouTube updates

2. **Cross-Platform Support**
   - macOS testing and improvements
   - Linux compatibility
   - Platform-specific features

3. **User Experience**
   - UI/UX improvements
   - Accessibility features
   - Performance optimizations

4. **New Features**
   - Advanced audio settings
   - Playlist management
   - Keyboard customization

## 🔧 Build Process

### Local Development
```bash
npm run dev          # Development mode with hot reload
npm run build:win    # Build for Windows
npm run build:mac    # Build for macOS
npm run build:linux  # Build for Linux
```

### Release Process
Releases are automated via GitHub Actions when tags are pushed:
```bash
git tag v1.1.0
git push origin v1.1.0
```

## 📞 Getting Help

- **Issues**: Create an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the maintainer at utsavc317@gmail.com

## 📜 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the community

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Special thanks in the app's about section

Thank you for contributing to YouTube Music Desktop! 🎵
