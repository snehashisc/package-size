const { workspace, window, Range, Position } = require('vscode');
const fileSize = require('filesize');
const logger = require('./logger');

const decorations = {} as any;
const decorationType = window.createTextEditorDecorationType({});

function setDecorations(fileName: any, packages: any) {
  decorations[fileName] = {};
  packages.forEach((packageInfo: any) => decorate(fileName, packageInfo));
  flushDecorationsDebounced(fileName);
}

function decorate(fileName: any, packageInfo: any) {
  const { line } = packageInfo;
  decorations[fileName][line] = packageInfo;
}

function calculated(fileName: any, packageInfo: any) {
  if (packageInfo.error) {
    logger.log(
      `Error Calculated: ${JSON.stringify({ ...packageInfo, error: true })}`,
    );
    if (Array.isArray(packageInfo.error)) {
      packageInfo.error.forEach((err: any) => {
        logger.log(err?.message || JSON.stringify(err));
      });
    } else {
      logger.log(packageInfo.error.toString());
    }
  } else {
    logger.log(`Calculated: ${JSON.stringify(packageInfo)}`);
  }
  decorate(fileName, packageInfo);
  flushDecorationsDebounced(fileName);
}

function getDecorationMessage(packageInfo: any) {
  const configuration = workspace.getConfiguration('packageSize');
  const text = (s: any) => ({
    after: {
      contentText: s,
      margin: `0 0 0 ${configuration.margin}rem`,
      fontStyle: configuration.fontStyle,
    },
  });
  if (!packageInfo) {
    return text('Calculating...');
  }
  const size = fileSize(packageInfo.size, { unix: true });
  const gzip = fileSize(packageInfo.gzip, { unix: true });
  if (configuration.bundleSizeDecoration === 'minified') {
    return text(`${size}`);
  } else if (configuration.bundleSizeDecoration === 'gzipped') {
    return text(`${gzip}`);
  } else if (configuration.bundleSizeDecoration === 'compressed') {
    return text(`${gzip}`);
  } else {
    return text(`${size} (gzipped: ${gzip})`);
  }
}

function getDecorationColor(packageInfo: any) {
  const configuration = workspace.getConfiguration('packageSize');
  const color = (old: any, dark: any, light: any) => ({
    dark: { after: { color: old || dark } },
    light: { after: { color: old || light } },
  });
  const size =
    (configuration.bundleSizeColoring === 'minified'
      ? packageInfo?.size
      : packageInfo?.gzip) || 0;
  const sizeInKB = size / 1024;
  if (sizeInKB < configuration.smallPackageSize) {
    return color(
      configuration.smallPackageColor,
      configuration.smallPackageDarkColor,
      configuration.smallPackageLightColor,
    );
  } else if (sizeInKB < configuration.mediumPackageSize) {
    return color(
      configuration.mediumPackageColor,
      configuration.mediumPackageDarkColor,
      configuration.mediumPackageLightColor,
    );
  } else {
    return color(
      configuration.largePackageColor,
      configuration.largePackageDarkColor,
      configuration.largePackageLightColor,
    );
  }
}

function decoration(line: any, packageInfo: any) {
  return {
    renderOptions: {
      ...getDecorationColor(packageInfo),
      ...getDecorationMessage(packageInfo),
    },
    range: new Range(
      new Position(line - 1, 1024),
      new Position(line - 1, 1024),
    ),
  };
}

let decorationsDebounce: any;
function flushDecorationsDebounced(fileName: any) {
  clearTimeout(decorationsDebounce);
  decorationsDebounce = setTimeout(() => flushDecorations(fileName), 10);
}

function flushDecorations(fileName: any) {
  let arr = {} as any;
  const { showCalculatingDecoration } =
    workspace.getConfiguration('packageSize');
  Object.entries(decorations[fileName]).forEach(([line, packageInfo]) => {
//     if (packageInfo.size === undefined && showCalculatingDecoration) {
//       arr[line] = decoration(line, undefined);
//     } else if (packageInfo.size > 0) {
//       arr[line] = decoration(line, packageInfo);
//  }
console.log(decorations, fileName);
  });
//debug later
//   const log = Object.entries(arr)
//     .map(([line, decoration]) => {
//       const message = decoration.renderOptions.after.contentText;
//       return `${fileName}, ${line}, ${message}`;
//     })
//     .join('\n');
//   logger.log(`Setting decorations:\n${log}`);

  window.visibleTextEditors
    .filter((editor: any) => editor.document.fileName === fileName)
    .forEach((editor: any) => {
      editor.setDecorations(decorationType, Object.values(arr));
    });
}

function clearDecorations() {
  window.visibleTextEditors.forEach((textEditor: any) => {
    textEditor.setDecorations(decorationType, []);
  });
}

module.exports = {
  setDecorations,
  calculated,
  clearDecorations,
};