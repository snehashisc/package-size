// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
// export function activate(context: vscode.ExtensionContext) {

// 	// Use the console to output diagnostic information (console.log) and errors (console.error)
// 	// This line of code will only be executed once when your extension is activated
// 	console.log('Congratulations, your extension "package-size" is now active!');

// 	// The command has been defined in the package.json file
// 	// Now provide the implementation of the command with registerCommand
// 	// The commandId parameter must match the command field in package.json
// 	let disposable = vscode.commands.registerCommand('package-size.helloWorld', () => {
// 		// The code you place here will be executed every time your command is executed
// 		// Display a message box to the user
// 		vscode.window.showInformationMessage('Hello World from Package Size!');
// 	});

// 	context.subscriptions.push(disposable);
// }

// This method is called when your extension is deactivated
// export function deactivate() {}

// if (typeof self !== 'undefined') {
// 	/* global self */
// 	//hacks for global scope of web worker
// 	self.setImmediate = self.setImmediate || (fn => setTimeout(fn, 0));
// 	self.Buffer = self.Buffer || require('buffer').Buffer;
// 	self.process = require('process/browser');
// 	self.process.hrtime = require('browser-process-hrtime');
// 	self.process.stderr = {};
//   }
  
  const { window, workspace, commands } = require('vscode');
  const { importCost, cleanup, Lang } = require('import-cost');
  const { calculated, setDecorations, clearDecorations } = require('./decorator');
  const logger = require('./logger');
  
  let isActive = true;
  
  function activate(context: any) {
	try {
	  logger.log('starting...');
	  workspace.onDidChangeTextDocument((ev: any) => processActiveFile(ev.document));
	  window.onDidChangeActiveTextEditor((ev: any) => processActiveFile(ev?.document));
	  processActiveFile(window.activeTextEditor?.document);
  
	  context.subscriptions.push(
		commands.registerCommand('package-size.helloWorld', () => {
		  isActive = !isActive;
		  if (isActive) {
			processActiveFile(window.activeTextEditor?.document);
		  } else {
			deactivate();
		  }
		}),
	  );
	} catch (e) {
	  logger.log('wrapping error: ' + e);
	}
	return { logger };
  }
  
  function deactivate() {
	cleanup();
	logger.dispose();
	clearDecorations();
  }
  
  let emitters = {} as any;
  async function processActiveFile(document: any) {
	if (isActive && document ) { //&& language(document)
	  const { fileName } = document;
	  emitters[fileName]?.removeAllListeners();
  
	  const { timeout } = workspace.getConfiguration('importCost');
	  const config = { concurrent: false, maxCallTime: timeout };
	  const text = document.getText();
	  const emitter = importCost(fileName, text, 'en', config);
	  emitter.on('error', (e: any) => logger.log(`importCost error: ${e}`));
	  emitter.on('start', (packages: any) => setDecorations(fileName, packages));
	  emitter.on('calculated',(packageInfo: any) => calculated(fileName, packageInfo));
	  emitter.on('done', (packages: any) => setDecorations(fileName, packages));
	  //emitter.on('log', (Log: any) => logger.log(log));
	  emitters[fileName] = emitter;
	}
  }
  
//   function language({ fileName, languageId }) {
// 	if (languageId === 'Log') {
// 	  return;
// 	}
// 	const configuration = workspace.getConfiguration('importCost');
// 	const typescriptRegex = new RegExp(
// 	  configuration.typescriptExtensions.join('|'),
// 	);
// 	const javascriptRegex = new RegExp(
// 	  configuration.javascriptExtensions.join('|'),
// 	);
// 	const vueRegex = new RegExp(configuration.vueExtensions.join('|'));
// 	const svelteRegex = new RegExp(configuration.svelteExtensions.join('|'));
// 	if (languageId === 'svelte' || svelteRegex.test(fileName)) {
// 	  return Lang.SVELTE;
// 	} else if (languageId === 'vue' || vueRegex.test(fileName)) {
// 	  return Lang.VUE;
// 	} else if (
// 	  languageId === 'typescript' ||
// 	  languageId === 'typescriptreact' ||
// 	  typescriptRegex.test(fileName)
// 	) {
// 	  return Lang.TYPESCRIPT;
// 	} else if (
// 	  languageId === 'javascript' ||
// 	  languageId === 'javascriptreact' ||
// 	  javascriptRegex.test(fileName)
// 	) {
// 	  return Lang.JAVASCRIPT;
// 	} else {
// 	  return undefined;
// 	}
//   }
  
  module.exports = {
	activate,
	deactivate,
  };
