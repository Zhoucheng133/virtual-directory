import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { networkInterfaces } from 'os';
import express from 'express';
import path from 'path';
import http from "http";
import * as CryptoJS from 'crypto-js';
import cors from 'cors';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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

// 运行服务
ipcMain.handle('runServer', (_event, port, localPath, username, password)=>{
  expressApp=express();
  expressApp.use(cors());
  expressApp.use('/assets', express.static(path.join(__dirname, '../../ui/dist/assets')));

  // 指向页面
  expressApp.get('/', async(_req: any, res: any)=>{
    res.sendFile(path.join(__dirname, '../../ui/dist', 'index.html'));
  })

  // 判断是否需要登陆
  expressApp.get('/api/needLogin', async(_req: any, res: any)=>{
    if(username.length==0){
      res.json(false);
    }else{
      res.json(true);
    }
  })

  const loginController=(name: string, pass: string)=>{
    if(username.length==0){
      return true;
    }
    const mypass=CryptoJS.SHA256(password).toString();
    if(pass==mypass && name==username){
      return true;
    }
    return false;
  }

  // 登陆请求
  expressApp.get('/api/login', async(req: any, res: any)=>{
    const name=req.query.username;
    const pass=req.query.password;
    if(loginController(name, pass)){
      res.json(true);
    }else{
      res.json(false);
    }
  })

  const formatFileSize=(bytes: number)=>{
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // TODO 获取数据
  expressApp.get('/api/getData', async(req: any, res: any)=>{

    const innerPath=JSON.parse(req.query.path);
    const name=req.query.username;
    const pass=req.query.password;
    
    let dirs: any[]=[];
    if(loginController(name, pass)){
      try {
        // console.log(path.join(localPath, ...innerPath));
        const files=fs.readdirSync(path.join(localPath, ...innerPath));
        files.forEach(item => {
          const itemPath = path.join(localPath, ...innerPath, item);
          const stats = fs.statSync(itemPath);
          dirs.push({
            id: uuidv4(),
            isFile: stats.isFile(),
            isSelected: false,
            fileName: item,
            size:stats.isFile() ? formatFileSize(stats.size): null
          })
        })
        res.json({
          ok: true,
          data: dirs
        })
      } catch (error) {
        res.json({
          ok: false,
          data: "目录不存在"
        });
      }
    }else{
      res.json({
        ok: false,
        data: "用户验证失败"
      });
    }
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