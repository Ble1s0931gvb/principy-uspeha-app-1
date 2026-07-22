const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 320,
    minHeight: 500,
    frame: false,
    title: 'Принципы Успеха',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#05060c'
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state', 'maximized');
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state', 'normal');
  });
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('window-state', 'fullscreen');
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('window-state', 'normal');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('window-state', mainWindow.isMaximized() ? 'maximized' : mainWindow.isFullScreen() ? 'fullscreen' : 'normal');
  });
}

ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('window-fullscreen', () => {
  mainWindow?.setFullScreen(!mainWindow.isFullScreen());
});
ipcMain.handle('window-close', () => mainWindow?.close());
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized());

ipcMain.handle('save-data', async (event, { key, value }) => {
  const dataPath = path.join(app.getPath('userData'), 'app-data.json');
  let data = {};
  if (fs.existsSync(dataPath)) data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  data[key] = value;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  return true;
});

ipcMain.handle('load-data', async (event, { key }) => {
  const dataPath = path.join(app.getPath('userData'), 'app-data.json');
  if (!fs.existsSync(dataPath)) return null;
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  return data[key] || null;
});

ipcMain.handle('get-system-fonts', async () => {
  try {
    const fontDir = path.join('C:', 'Windows', 'Fonts');
    return fs.readdirSync(fontDir)
      .filter(f => /\.(ttf|otf|woff|woff2)$/i.test(f))
      .map(f => f.replace(/\.(ttf|otf|woff|woff2)$/i, ''))
      .sort();
  } catch {
    return ['Arial', 'Segoe UI', 'Consolas', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Tahoma'];
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
