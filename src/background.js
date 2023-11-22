'use strict'

// yarn add mime-types

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

const mime = require('mime-types');
function getContentType(extension) {
  const contentType = mime.contentType(extension);
  return contentType || 'application/octet-stream';
}

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

// 删除文件
async function delFile(path) {
	const fs = require('fs').promises;
	try {
		// 执行删除操作
		await fs.rm(path, { recursive: true });
		// console.log("删除成功");
		return true;
	} catch (err) {
		// console.log("删除出错:", err);
		return false;
	}
}

// 启动服务器
ipcMain.on("serverOn", async (event, sharePath, sharePort, username, password) => {
  const path = require('path');
  const fs = require('fs');
  expressApp=express();

  // 设置静态文件夹
  expressApp.use(express.static(path.join(__dirname, '../ui_interface/virtual-dir-page/dist')));
  // 临时允许跨域
  expressApp.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

  // 处理所有页面请求，返回Vue页面
  expressApp.get('*', async (req, res) => {
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
      var folderName=req.query.name;
      var dir=path.join(sharePath, req.query.dir);
      fs.mkdir(dir+"/"+folderName, { recursive: true }, (err) => {
				if (err) {
					res.json({ "status": false });
				} else {
					res.json({ "status": true });
				}
			});
    }else if(req.originalUrl.startsWith('/api/rename')){
      // Required: 文件夹地址[dir] & 原文件名[oldName] & 新名称[newName]
      var dir=path.join(sharePath, req.query.dir);
      fs.rename(dir+"/"+req.query.oldName, dir+"/"+req.query.newName, (err) => {
				if (err) {
          console.log(err);
					res.json({ "status": false });
				} else {
					res.json({ "status": true });
				}
			});
    }else if(req.originalUrl.startsWith('/api/del')){
      // TODO 删除文件
      var dir=path.join(sharePath, req.query.dir);
      var files=JSON.parse(req.query.files);
      // res.json({ "dir": dir, "files": files });
      var rlt=await new Promise(async (resolve)=>{
        for(const item of files){
          const path=dir+"/"+item.name;
          await delFile(path)
          .then((result) => {
            if(result==false){
              resolve(false);
              return;
            }
          })
        }
        resolve(true);
        return;
      })
      res.json({ "status": rlt });
    }else if(req.originalUrl.startsWith('/api/getFile')){
      // Required: 文件地址[dir]
      const dir=path.join(sharePath, req.query.dir);
      fs.stat(dir, (err, stats) => {
        if (err) {
          res.end("Request ERR");
        } else {
          if (stats.isDirectory()) {
            res.end("Not file")
            return;
          } else {
            const extension = path.extname(dir).toLowerCase();
            const contentType = getContentType(extension);
            const stream = fs.createReadStream(dir);
            var fileSize=stats.size;
            res.setHeader("Accept-Ranges","bytes");
            res.setHeader('Content-Length', fileSize);
            res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(path.basename(dir))}`);
            res.setHeader('Content-Type', contentType);
            stream.pipe(res);
          }
        }
      });
    }else if(req.originalUrl.startsWith('/api/downloadFile')){
      // Required: 文件地址[dir]
      const dir=path.join(sharePath, req.query.dir);
      fs.stat(dir, (err, stats) => {
        if (err) {
          res.end("Request ERR");
        } else {
          if (stats.isDirectory()) {
            res.end("Not file")
            return;
          } else {
            const extension = path.extname(dir).toLowerCase();
            const stream = fs.createReadStream(dir);
            var fileSize=stats.size;
            res.setHeader("Accept-Ranges","bytes");
            res.setHeader('Content-Length', fileSize);
            res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(path.basename(dir))}`);
            res.setHeader('Content-Type', 'application/octet-stream');
            stream.pipe(res);
          }
        }
      });
    }else if(req.originalUrl.startsWith('/api/authRequest')){
      res.json({"needLogin": username=="" && password=="" ? false : true, "username": username, "password": password});
    }else{
      // 否则返回Vue页面
      res.sendFile(path.join(__dirname, '../ui_interface/virtual-dir-page/dist', 'index.html'));
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