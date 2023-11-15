'use strict'

import { app, protocol, BrowserWindow, ipcMain, dialog } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
// import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

const express = require('express');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

let win;

async function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    win.loadURL('app://./index.html')
  }
}

const http = require('http');

let expressApp;
let server;

var sockets = [];

// 关闭服务器
ipcMain.on("serverOff", async (event) => {
  sockets.forEach(function(socket){
		socket.destroy();
	});
  if(server){
    server.close(() => {
      event.reply('serverOffResponse', 'success');
    });
  }else{
    event.reply('serverOffResponse', 'error');
  }
})

// 启动服务器
ipcMain.on("serverOn", async (event, sharePath, sharePort, username, password) => {
  const path = require('path');
  const fs = require('fs');
  expressApp=express();

  // 设置静态文件夹
  expressApp.use(express.static(path.join(__dirname, '../ui_interface/vir_dir_page/dist')));

  // 处理所有页面请求，返回Vue页面
  expressApp.get('*', (req, res) => {
    if(req.originalUrl.startsWith('/api/getlist')) {
      // 获取目录列表
      // Required: 请求的目录[dir]，注意不需要开头的/
      const dir=req.query.dir;
      if(dir==undefined){
        res.json({ "list": "err" });
        return;
      }
      console.log(sharePath+dir);
      fs.readdir(sharePath+dir, (err, files) => {
        if (err) {
          res.json({ "list": "err" });
        } else {
          var dirList=[];
          files.forEach(file => {
            const filePath = path.join(sharePath+dir, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
              dirList.push({"type":"file","name":file,"size":stats.size,"selected":false});
            } else if (stats.isDirectory()) {
              dirList.push({"type":"dir","name":file,"selected":false});
            }
          });
          res.json({ "list": dirList });
        }
      });
    }else if(req.originalUrl.startsWith('/api/upload')){
      // TODO 上传
      // Required: 上传的目录[dir]
    }else if(req.originalUrl.startsWith('/api/newFolder')){
      // TODO 新建文件夹
      // Required: 新建文件夹的目录[dir] & 新建文件夹的名称[name]
    }else if(req.originalUrl.startsWith('/api/rename')){
      // TODO 重命名文件夹
      // Required: 文件夹地址[dir] & 文件夹的的新名称[name]
    }else if(req.originalUrl.startsWith('/api/del')){
      // TODO 删除文件
      // Required: 文件/文件夹地址[dir]
    }else if(req.originalUrl.startsWith('/api/getFile')){
      // Required: 文件地址[dir]
      const dir=req.query.dir+sharePath;
    }else{
      // 否则返回Vue页面
      res.sendFile(path.join(__dirname, '../ui_interface/vir_dir_page/dist', 'index.html'));
    }
  });

  server = http.createServer(expressApp);

  // 添加到socket
  server.on("connection", function (socket) {
		sockets.push(socket);
		socket.once("close", function () {
			sockets.splice(sockets.indexOf(socket), 1);
		});
	});

  // 启动服务器
  server.listen(sharePort, () => {

    console.log(`Server is running at http://localhost:${sharePort}`);
    event.reply('serverOnResponse', 'success');
  });

});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('ready', async () => {
  createWindow()
})

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

// 选择目录函数，返回路径
ipcMain.on("selectDir", async (event) => {
	dialog.showOpenDialog(win, {
		properties: ['openDirectory'],
	}).then(result => {
		const folderPath = result.filePaths[0];
		win.webContents.send('folder-selected', folderPath);
		event.reply('getDir', folderPath);
	})
	.catch(err => {
		event.reply('getDir', "ERR!");
	});
});

const os = require('os');

// 获取IP地址函数
ipcMain.on("getIP",async (event) => {
	const networkInterfaces = os.networkInterfaces();
	const ipv4Addresses = [];
	Object.keys(networkInterfaces).forEach(interfaceName => {
		const addresses = networkInterfaces[interfaceName];
		addresses.forEach(address => {
			if (address.family === 'IPv4' && !address.internal) {
				ipv4Addresses.push(address.address);
			}
		});
	});
	const ipv6Addresses = [];
	Object.keys(networkInterfaces).forEach(interfaceName => {
	  const addresses = networkInterfaces[interfaceName];
	  addresses.forEach(address => {
		if (address.family === 'IPv6' && !address.internal) {
		  ipv6Addresses.push(address.address);
		}
	  });
	});
	event.reply('getIpResponse', ipv4Addresses, ipv6Addresses);
});

// 获取系统类别函数
ipcMain.on("getSys",async(event)=>{
	if(process.platform == 'darwin'){
		event.reply('getSysResponse', 'macOS');
	}else if(process.platform=='win32' ){
		event.reply('getSysResponse', 'Windows');
	}else{
		event.reply('getSysResponse', 'Linux');
	}
});

// 最小化窗口函数
ipcMain.on("winMin",async(event)=>{
	win.minimize();
}),

// 关闭窗口函数
ipcMain.on("winClose",async(event)=>{
	win.close();
})