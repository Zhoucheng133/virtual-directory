import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { networkInterfaces } from 'os';
import express from 'express';

let mainWindow;
let expressApp;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 700,
    height: 500,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    titleBarStyle: "hidden",
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 下面是主进程函数

// 关闭App
ipcMain.on('closeApp', ()=>{
  app.quit();
})

// 最小化App
ipcMain.on('minApp', ()=>{
  mainWindow.minimize();
})

// 获取IP地址
ipcMain.handle('getIP', ()=>{
  const interfaces = networkInterfaces();
  let addr:string[]=[];
  for (const interfaceName in interfaces) {
    for (const details of interfaces[interfaceName] ?? []) {
      if (details.family === 'IPv4') {
        addr.push(details.address);
      }
    }
  }
  return addr[0];
})

// 浏览本地目录
ipcMain.handle('selectDir', async ()=>{
  let returnPath="";
  await dialog.showOpenDialog({
    properties: ['openDirectory'],
  }).then((path)=>{
    returnPath=path.filePaths[0];
  })
  return returnPath;
})

ipcMain.handle('runServe', ()=>{
  expressApp=express();
})