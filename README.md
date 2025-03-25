# History Stats Firefox Extension

A simple Firefox extension that shows a "Hello World" message when clicking the browser action icon.

## Installation

1. Open Firefox and navigate to `about:debugging`
2. Click on "This Firefox" in the left sidebar
3. Click on "Load Temporary Add-on"
4. Navigate to this directory and select the `manifest.json` file

## Icons

Before loading the extension, you need to create two icon files:
- `icons/icon-48.png` (48x48 pixels)
- `icons/icon-96.png` (96x96 pixels)

You can use any image editor to create these icons, or use placeholder icons for testing.

## Development

The extension consists of the following files:
- `manifest.json`: Extension configuration
- `popup/popup.html`: Popup HTML structure
- `popup/popup.css`: Popup styling
- `popup/popup.js`: Popup functionality
- `icons/`: Directory containing extension icons 