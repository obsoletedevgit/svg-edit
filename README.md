# SVG Split Editor

Edit and preview SVG files side by side directly in VS Code. This extension provides a split view with a live preview and a CodeMirror editor, including zoom, pan, and theme support.

## Features

- **Split View:** Edit SVG code and see the live preview simultaneously.  
- **Resizable Panels:** Drag the divider to adjust the editor or preview size.  
- **Zoom and Pan:** Zoom in/out and pan the SVG preview.  
- **Theme Support:** Editor and toolbar buttons match your current VS Code theme.  
- **Toggle Panels:** Show or hide the code editor or SVG preview as needed.  
- **Live Updates:** Changes in the code editor immediately reflect in the preview.

## Usage

1. Open any `.svg` file in VS Code.  
2. The SVG Split Editor will open automatically.  
3. Use the toolbar buttons to zoom, reset, or toggle panels.  
4. Drag the divider between editor and preview to resize.

## Toolbar Buttons

- **+ / −:** Zoom in and out.  
- **Reset:** Reset zoom and pan.  
- **Toggle Code:** Show or hide the code editor.  
- **Toggle SVG:** Show or hide the SVG preview.

## Requirements

- Visual Studio Code version 1.90.0 or higher.

## Extension Settings

This extension does not have additional configurable settings.

## Known Issues

- Extremely large SVG files may slow down live updates.  
- Complex animations inside SVGs may not render correctly in the live preview.

## License

This extension is licensed under the GNU 2.0 License. See the [LICENSE](LICENSE) file for details.