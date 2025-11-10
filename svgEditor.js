const vscode = require("vscode");

class SvgEditorProvider {
	static register(context) {
		const provider = new SvgEditorProvider(context);
		return vscode.window.registerCustomEditorProvider(
			"svgEdit.editor",
			provider
		);
	}

	constructor(context) {
		this.context = context;
	}

	resolveCustomTextEditor(document, webviewPanel) {
		webviewPanel.webview.options = { enableScripts: true };
		webviewPanel.webview.html = this.getHtml(webviewPanel.webview);

		const updateWebview = () => {
			webviewPanel.webview.postMessage({
				type: "update",
				text: document.getText(),
			});
		};

		const changeDocSubscription = vscode.workspace.onDidChangeTextDocument(
			(e) => {
				if (e.document.uri.toString() === document.uri.toString()) {
					updateWebview();
				}
			}
		);

		webviewPanel.onDidDispose(() => changeDocSubscription.dispose());

		webviewPanel.webview.onDidReceiveMessage((e) => {
			if (e.type === "edit") {
				const edit = new vscode.WorkspaceEdit();
				edit.replace(
					document.uri,
					new vscode.Range(0, 0, document.lineCount, 0),
					e.text
				);
				vscode.workspace.applyEdit(edit);
			}
		});

		updateWebview();
	}

	getHtml(webview) {
		const styleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(
				this.context.extensionUri,
				"media",
				"editor.css"
			)
		);

		const cmCss = webview.asWebviewUri(
			vscode.Uri.joinPath(
				this.context.extensionUri,
				"media/codemirror/lib/codemirror.css"
			)
		);

		const cmJs = webview.asWebviewUri(
			vscode.Uri.joinPath(
				this.context.extensionUri,
				"media/codemirror/lib/codemirror.js"
			)
		);

		const xmlMode = webview.asWebviewUri(
			vscode.Uri.joinPath(
				this.context.extensionUri,
				"media/codemirror/mode/xml/xml.js"
			)
		);

		return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="${styleUri}">
      <link rel="stylesheet" href="${cmCss}">
      <style>
        html, body { margin:0; height:100%; color:var(--vscode-editor-foreground); background-color:var(--vscode-editor-background); }
        body { display:flex; overflow:hidden; }
        #editor, #preview-container { height:100%; flex:1 1 50%; min-width:50px; }
        #divider { width:5px; cursor:col-resize; background:var(--vscode-editor-foreground);}
        #preview-toolbar button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: 1px solid var(--vscode-button-border);
          border-radius: 3px;
          padding: 2px 6px;
          cursor: pointer;
          font-size: 12px;
          margin: 0 2px;
        }
        #preview-toolbar button:hover { background-color: var(--vscode-button-hoverBackground); }
        #preview { display:flex; align-items:center; justify-content:center; background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground);}
        #preview-inner { transform-origin:0 0; }
        .CodeMirror { height:100%; color: var(--vscode-editor-foreground); background-color: var(--vscode-editor-background);}
        .CodeMirror-cursor { border-left: 1px solid var(--vscode-editorCursor-foreground); }
        .CodeMirror-gutters { background-color: var(--vscode-editorGutter-background); border-right: 1px solid var(--vscode-editorGutter-border);}
      </style>
    </head>
    <body>
      <div id="editor"></div>
      <div id="divider"></div>
      <div id="preview-toolbar" style="position:absolute; top:5px; right:5px; z-index:10;">
        <button id="zoom-in">+</button>
        <button id="zoom-out">−</button>
        <button id="reset-zoom">Reset</button>
        <button id="toggle-editor">Toggle Code</button>
        <button id="toggle-preview">Toggle SVG</button>
      </div>
      <div id="preview-container" style="position:relative; overflow:hidden;">
        <div id="preview-inner">
          <div id="preview"></div>
        </div>
      </div>
      <script src="${cmJs}"></script>
      <script src="${xmlMode}"></script>
      <script>
        const vscode = acquireVsCodeApi();
        const savedState = vscode.getState() || {};
        const editorDiv = document.getElementById('editor');
        const previewContainer = document.getElementById('preview-container');
        const previewInner = document.getElementById('preview-inner');
        const previewSvg = document.getElementById('preview');
        const divider = document.getElementById('divider');

        window.createEditor = function(container, initialValue, onChange){
          const editor = CodeMirror(container, {
            value: initialValue,
            mode: "xml",
            lineNumbers: true,
            lineWrapping: true
          });
          editor.lastValue = initialValue;
          editor.on("change", () => {
            const text = editor.getValue();
            if (text !== editor.lastValue) {
              onChange(text);
              editor.lastValue = text;
              saveState();
            }
          });
          return editor;
        }

        const initialText = savedState.text || '';
        const editor = window.createEditor(editorDiv, initialText, text => {
          previewSvg.innerHTML = text;
          vscode.postMessage({ type: 'edit', text });
        });

        let scale = savedState.scale || 1;
        let offsetX = savedState.offsetX || 0;
        let offsetY = savedState.offsetY || 0;
        let showEditor = savedState.showEditor !== false;
        let showPreview = savedState.showPreview !== false;

        function saveState() {
          vscode.setState({
            text: editor.getValue(),
            scale,
            offsetX,
            offsetY,
            showEditor,
            showPreview
          });
        }

        editorDiv.style.display = showEditor ? 'block' : 'none';
        previewSvg.style.display = showPreview ? 'block' : 'none';

        window.addEventListener('message', event => {
          if (event.data.type === 'update') {
            const newText = event.data.text;
            if (editor.getValue() !== newText) {
              editor.setValue(newText);
              editor.lastValue = newText;
              previewSvg.innerHTML = newText;
              saveState();
            }
          }
        });

        let isDragging = false;
        divider.addEventListener('mousedown', () => { isDragging = true; document.body.style.cursor = 'col-resize'; });
        window.addEventListener('mousemove', e => { if (!isDragging) return; editorDiv.style.flex = '0 0 ' + e.clientX + 'px'; previewContainer.style.flex = '1'; editor.refresh(); });
        window.addEventListener('mouseup', () => { isDragging = false; document.body.style.cursor = 'default'; });

        let isPanning = false, startX, startY;

        function updateTransform() {
          const containerWidth = previewContainer.clientWidth;
          const containerHeight = previewContainer.clientHeight;
          const contentWidth = previewInner.scrollWidth * scale;
          const contentHeight = previewInner.scrollHeight * scale;
          const minX = Math.min(0, containerWidth - contentWidth);
          const maxX = 0;
          const minY = Math.min(0, containerHeight - contentHeight);
          const maxY = 0;
          offsetX = Math.max(minX, Math.min(maxX, offsetX));
          offsetY = Math.max(minY, Math.min(maxY, offsetY));
          previewInner.style.transform = \`translate(\${offsetX}px, \${offsetY}px) scale(\${scale})\`;
          saveState();
        }

        document.getElementById('zoom-in').addEventListener('click', () => { scale *= 1.2; updateTransform(); });
        document.getElementById('zoom-out').addEventListener('click', () => { scale /= 1.2; updateTransform(); });
        document.getElementById('reset-zoom').addEventListener('click', () => { scale = 1; offsetX = 0; offsetY = 0; updateTransform(); });

        previewInner.addEventListener('mousedown', e => { isPanning = true; startX = e.clientX - offsetX; startY = e.clientY - offsetY; previewInner.style.cursor = 'move'; });
        window.addEventListener('mousemove', e => { if (!isPanning) return; offsetX = e.clientX - startX; offsetY = e.clientY - startY; updateTransform(); });
        window.addEventListener('mouseup', () => { isPanning = false; previewInner.style.cursor = 'default'; });

        document.getElementById('toggle-editor').addEventListener('click', () => { showEditor = !showEditor; editorDiv.style.display = showEditor ? 'block' : 'none'; if (showEditor) editor.refresh(); saveState(); });
        document.getElementById('toggle-preview').addEventListener('click', () => { showPreview = !showPreview; previewSvg.style.display = showPreview ? 'block' : 'none'; if (showPreview) updateTransform(); saveState(); });

        previewSvg.innerHTML = initialText;
        updateTransform();
      </script>
    </body>
    </html>
  `;
	}
}

module.exports = { SvgEditorProvider };
