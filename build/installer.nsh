; Custom NSIS installer script for YouTube Music Desktop
; This script customizes the installer appearance and behavior

!define PRODUCT_NAME "YouTube Music Desktop"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "YouTube Music Desktop Team"
!define PRODUCT_WEB_SITE "https://github.com/yourusername/youtube-music-desktop"

; Modern UI
!include "MUI2.nsh"

; Custom installer pages
!define MUI_WELCOMEPAGE_TITLE "Welcome to ${PRODUCT_NAME} Setup"
!define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of ${PRODUCT_NAME}.$\r$\n$\r$\nYouTube Music Desktop is an unofficial desktop app for YouTube Music with ad blocking and enhanced features.$\r$\n$\r$\nClick Next to continue."

!define MUI_FINISHPAGE_TITLE "Installation Complete"
!define MUI_FINISHPAGE_TEXT "${PRODUCT_NAME} has been successfully installed on your computer.$\r$\n$\r$\nEnjoy your ad-free YouTube Music experience!"

; Installer settings
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\${PRODUCT_NAME}"
ShowInstDetails show
ShowUnInstDetails show

; Custom branding
BrandingText "${PRODUCT_NAME} v${PRODUCT_VERSION}"

; Compression
SetCompressor lzma
