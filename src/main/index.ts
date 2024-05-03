import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { networkInterfaces } from 'os';
import express from 'express';
import path from 'path';
import http from "http";
import * as CryptoJS from 'crypto-js';

let mainWindow: BrowserWindow;
let expressApp: any;
var sockets: any[] = [];
let server: any;

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

ipcMain.handle('runServer', (_event, port, localPath, username, password)=>{
  expressApp=express();
  expressApp.use('/assets', express.static(path.join(__dirname, '../../ui/dist/assets')));

  // 指向页面
  expressApp.get('/', async(_req, res)=>{
    res.sendFile(path.join(__dirname, '../../ui/dist', 'index.html'));
  })

  // 判断是否需要登陆
  expressApp.get('/api/needLogin', async(_req: any, res: any)=>{
    if(username.length==0){
      res.send(false);
    }else{
      res.send(true);
    }
  })

  // 登陆请求
  expressApp.get('/api/login', async(req: any, res: any)=>{
    const name=req.query.name;
    const pass=req.query.password;
    const mypass=CryptoJS.SHA256(password);
    if(pass==mypass && name==username){
      res.send(true);
    }else{
      res.send(false);
    }
  })

  // TODO 获取数据
  expressApp.get('/api/getData', async(req: any, res: any)=>{
    const innerPath=req.query.path;
    res.send(localPath+'/'+innerPath);
  })

  server = http.createServer(expressApp);
  server.on("connection", function (socket: any) {
		sockets.push(socket);
		socket.once("close", function () {
			sockets.splice(sockets.indexOf(socket), 1);
		});
	});
  server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
})

ipcMain.handle('stopServer', ()=>{
  sockets.forEach(function(socket){
		socket.destroy();
	});
  if(server){
    server.close(() => {
      return true;
    });
  }
  return false;
})