const vscode = require("vscode");
const { SvgEditorProvider } = require("./svgEditor");

function activate(context) {
	context.subscriptions.push(SvgEditorProvider.register(context));
}

function deactivate() {}

module.exports = { activate, deactivate };
