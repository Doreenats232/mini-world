const { app, BrowserWindow } = require('electron');
const path = require('path');
function createWindow() {
  const w = new BrowserWindow({ width: 1280, height: 720, backgroundColor: '#87ceeb', autoHideMenuBar: true });
  w.loadFile(path.join(__dirname, '../dist/index.html'));
}
app.whenReady().then(() => {
  createWindow();
  if (app.isPackaged) {
    try { require('electron-updater').autoUpdater.checkForUpdatesAndNotify(); } catch (e) {}
  }
});
app.on('window-all-closed', () => app.quit());
