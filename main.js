const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

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

ipcMain.handle('fetch-url', async (event, url) => {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    const mod = url.startsWith('https') ? https : http;
    const html = await new Promise((resolve, reject) => {
      const req = mod.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirect = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
          const rMod = redirect.startsWith('https') ? https : http;
          rMod.get(redirect, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (rRes) => {
            let data = '';
            rRes.on('data', c => data += c);
            rRes.on('end', () => resolve(data));
          }).on('error', reject);
          return;
        }
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '';
    const meta = html.match(/<meta[^>]*content="([^"]*)"[^>]*>/gi)?.map(m => m.match(/content="([^"]*)"/)?.[1]).filter(Boolean).join(', ') || '';
    const colors = new Set();
    const colorRegex = /#(?:[0-9a-fA-F]{3,8})\b/g;
    const cssBlocks = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    cssBlocks.forEach(block => {
      const css = block.replace(/<\/?style[^>]*>/gi, '');
      const bg = css.match(/background(?:-color)?\s*:\s*([^;}\n]+)/gi);
      if (bg) bg.forEach(b => {
        const c = b.split(':')[1]?.trim().split(/[\s;,]/)[0];
        if (c && c.startsWith('#') && c.length >= 4) colors.add(c);
      });
      const clr = css.match(/color\s*:\s*([^;}\n]+)/gi);
      if (clr) clr.forEach(c => {
        const v = c.split(':')[1]?.trim().split(/[\s;,]/)[0];
        if (v && v.startsWith('#') && v.length >= 4) colors.add(v);
      });
    });
    const bodyColors = html.match(/background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8})/g);
    if (bodyColors) bodyColors.forEach(b => {
      const c = b.split(':')[1]?.trim();
      if (c) colors.add(c);
    });
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 3000);
    const fonts = new Set();
    const fontMatches = html.match(/font-family\s*:\s*([^;}\n]+)/gi) || [];
    fontMatches.forEach(f => {
      const v = f.split(':')[1]?.trim().split(/[,;]/)[0]?.replace(/['"]/g, '').trim();
      if (v && !v.startsWith('var') && v.length < 40) fonts.add(v);
    });
    const googleFonts = html.match(/fonts\.googleapis\.com\/css2\?family=([^&"']+)/)?.[1]?.replace(/\+/g, ' ');
    if (googleFonts) fonts.add(googleFonts);
    const spacing = { paddings: [], margins: [], fontSizes: [] };
    const padMatches = html.match(/padding\s*:\s*(\d+px)/gi) || [];
    padMatches.slice(0, 10).forEach(p => { const v = p.match(/(\d+)px/)?.[1]; if (v) spacing.paddings.push(+v); });
    const margMatches = html.match(/margin\s*:\s*(\d+px)/gi) || [];
    margMatches.slice(0, 10).forEach(m => { const v = m.match(/(\d+)px/)?.[1]; if (v) spacing.margins.push(+v); });
    const fsMatches = html.match(/font-size\s*:\s*(\d+px)/gi) || [];
    fsMatches.slice(0, 10).forEach(f => { const v = f.match(/(\d+)px/)?.[1]; if (v) spacing.fontSizes.push(+v); });
    const avgPad = spacing.paddings.length ? Math.round(spacing.paddings.reduce((a,b)=>a+b,0)/spacing.paddings.length) : 16;
    const avgMarg = spacing.margins.length ? Math.round(spacing.margins.reduce((a,b)=>a+b,0)/spacing.margins.length) : 16;
    const avgFs = spacing.fontSizes.length ? Math.round(spacing.fontSizes.reduce((a,b)=>a+b,0)/spacing.fontSizes.length) : 16;
    const seq = html.match(/<nav|<aside|<header|<main|<section|<article|<footer|class="sidebar"|class="menu"|class="grid"|class="card"/gi) || [];
    const hasSidebar = seq.some(s => /nav|aside|sidebar/i.test(s));
    const hasHeader = seq.some(s => /header/i.test(s));
    const hasGrid = seq.some(s => /grid|card|article/i.test(s));
    const hasFooter = seq.some(s => /footer/i.test(s));
    return { ok: true, title, meta, colors: [...colors].slice(0, 20), text, url, structure: { fonts: [...fonts].slice(0, 5), avgPad, avgMarg, avgFs, hasSidebar, hasHeader, hasGrid, hasFooter, elementCount: seq.length } };
  } catch (e) {
    return { ok: false, error: e.message, url };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
