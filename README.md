# History Stats Firefox Extension

A Firefox extension that provides statistics and insights about your browsing history.

![screenshot](/icons/screenshot-popup.png)

![screenshot](/icons/screenshot-extension.png)

## Features

- View statistics about your browsing history
- Analyze browsing patterns and trends
- Privacy-focused: all data processing happens locally in your browser
- Simple and intuitive user interface

## Installation

1. Open Firefox and navigate to `about:debugging`
2. Click on "This Firefox" in the left sidebar
3. Click on "Load Temporary Add-on"
4. Navigate to this directory and select the `manifest.json` file

### Production Installation

Once the extension is published to the Firefox Add-ons store, you can install it directly from:
[Firefox Add-ons Store Link - Coming Soon]()

## Usage

1. Click on the History Stats icon in your browser toolbar
2. The popup will display statistics about your browsing history
3. Use the various tabs and options to explore different insights about your browsing habits

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

### Setup Development Environment

1. Clone this repository
```
git clone https://github.com/rolandortner/history-stats.git
cd history-stats
```

2. Make your changes to the code
3. Load the extension in Firefox as described in the Installation section

### Building for Production

To package the extension for submission to the Firefox Add-ons store:

1. Ensure all files are properly formatted and tested
2. Create a ZIP file containing all necessary files
3. Submit the ZIP file to the [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- This project was developed with the assistance of AI tools, specifically Cursor with Claude
- Mozilla for their excellent WebExtensions API documentation
- The open-source community for inspiration and resources

## Contact

Project Link: [https://github.com/rolandortner/history-stats](https://github.com/rolandortner/history-stats)

## Roadmap

- Add more detailed statistics and visualizations focusing on the working time
- Improve default categories
- Replace regex by simple list of domain names (TBD)
- Implement data export functionality
- Add customizable time ranges for history analysis
- Support for additional browsers (Chrome, Edge, etc.)