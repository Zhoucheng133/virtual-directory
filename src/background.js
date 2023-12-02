'use strict'

// yarn add mime-types

import { app, protocol, BrowserWindow, ipcMain, dialog, Menu} from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
// import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

const express = require('express');
const CryptoJS = require("crypto-js");
const multer = require('multer');
const cors = require('cors');
const archiver = require('archiver');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

let win;

async function createWindow() {
  Menu.setApplicationMenu(null);
  const path = require('path');
  win = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: false,
    frame: false,
    icon: path.join(__dirname, 'build/icon.png'),
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

// 是否许可操作
function Permission(username, password, originalUsername, originalPassword){
  if(originalPassword=="" && originalUsername==""){
    return true;
  }else if(originalPassword!="" && originalUsername!="" && (username==undefined || password==undefined)){
    return false;
  }else if(username==CryptoJS.SHA256(originalUsername).toString() && password==CryptoJS.SHA256(originalPassword).toString()){
    return true;
  }
  return false;
}

// 移除最后一个目录
function removeLastDirectory(filePath) {
  return filePath.replace(/\/[^/]*$/, '');
}

// 启动服务器
ipcMain.on("serverOn", async (event, sharePath, sharePort, username, password) => {
  const path = require('path');
  const fs = require('fs');
  expressApp=express();

  // 设置静态文件夹
  expressApp.use(express.static(path.join(__dirname, '../extraResources/virtual-dir-page/dist')));
  // 临时允许跨域
  expressApp.use(cors());

  expressApp.post('*', async (req, res)=>{
    if(req.originalUrl.startsWith('/api/upload')){
      // 上传
      // Required: 上传的目录[dir]
      // console.log(req.query.username+": "+req.query.password);
      if(!Permission(req.query.username, req.query.password, username, password)){
        res.json({ "status": "err" });
        return;
      }
      // var webkitRelativePaths = req.body.paths;
      const flag=req.query.isDir;
      try {
        var pathSave=path.join(sharePath, req.query.dir);
        const storage = multer.diskStorage({
          destination: function (req, file, cb) {
            const fs = require('fs-extra');
            if(flag=="true"){
              pathSave=removeLastDirectory(pathSave);
            }
            fs.ensureDirSync(pathSave);
            cb(null, pathSave);
          },
          filename: function (req, file, cb) {
            cb(null, Buffer.from(file.originalname, "latin1").toString("utf8"));
          }
        });
        const upload = multer({ storage: storage }).any('files');
        upload(req, res, (err) => {
          if (err) {
            console.log(err);
            res.status(400).json({ "status": false });
          }
          res.status(200).json({ "status": true });
        });
      } catch (error) {
        console.log(error);
        res.status(400).json({ "status": false });
      }
    }
  })

  // 处理所有页面请求，返回Vue页面
  expressApp.get('*', async (req, res) => {
    if(req.originalUrl.startsWith('/api/getlist')) {
      // 获取目录列表
      // Required: 请求的目录[dir]，注意不需要开头的/
      if(!Permission(req.get("username"), req.get("password"), username, password)){
        res.json({ "list": "err" });
        return;
      }
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
    }else if(req.originalUrl.startsWith('/api/newFolder')){
      // TODO 新建文件夹
      if(!Permission(req.get("username"), req.get("password"), username, password)){
        res.json({ "status": "err" });
        return;
      }
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
      // 重命名
      // Required: 文件夹地址[dir] & 原文件名[oldName] & 新名称[newName]
      if(!Permission(req.get("username"), req.get("password"), username, password)){
        res.json({ "status": "err" });
        return;
      }
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
      // 删除文件
      // Required: 文件夹地址[dir] & 需要删除的文件(夹)[files]
      if(!Permission(req.get("username"), req.get("password"), username, password)){
        res.json({ "status": "err" });
        return;
      }
      var dir=path.join(sharePath, req.query.dir);
      // console.log(req.query.files);
      var files=req.query.files;
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
      // 获取文件内容
      // Required: 文件地址[dir]
      if(!Permission(req.query.username, req.query.password, username, password)){
        res.json({ "status": "err" });
        return;
      }
      const dir=path.join(sharePath, req.query.dir);
      fs.stat(dir, (err, stats) => {
        if (err) {
          res.end("Request ERR");
        } else {
          if (stats.isDirectory()) {
            res.end("Not file")
            return;
          } else {
            const extension = path.extname(dir).toLowerCase()
            const contentType = getContentType(extension);
            const stat = fs.statSync(dir);
            const fileSize = stat.size;
            const range = req.headers.range;
            if (range) {
              const parts = range.replace(/bytes=/, '').split('-');
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          
              const chunksize = (end - start) + 1;
              const file = fs.createReadStream(dir, { start, end });
              const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': contentType,
              };
          
              res.writeHead(206, head);
              file.pipe(res);
            } else {
              const head = {
                'Content-Length': fileSize,
                'Content-Type': contentType,
              };
              res.writeHead(200, head);
              fs.createReadStream(dir).pipe(res);
            }
          }
        }
      });
    }else if(req.originalUrl.startsWith('/api/downloadFile')){
      // 下载文件
      // Required: 文件地址[dir]
      if(!Permission(req.query.username, req.query.password, username, password)){
        res.json({ "status": "err" });
        return;
      }
      const dir=path.join(sharePath, req.query.dir);
      fs.stat(dir, (err, stats) => {
        if (err) {
          console.log(err);
          res.end("Request ERR");
        } else {
          if (stats.isDirectory()) {
            res.end("Not file")
            return;
          } else {
            const stream = fs.createReadStream(dir);
            var fileSize=stats.size;
            res.setHeader("Accept-Ranges","bytes");
            res.setHeader('Content-Length', fileSize);
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(dir))}`);
            res.setHeader('Content-Type', 'application/octet-stream');
            stream.pipe(res);
          }
        }
      });
    }else if(req.originalUrl.startsWith('/api/multiDownload')){
      // 多文件下载
      // Required: 文件地址[dir], 文件[files]
      if(!Permission(req.query.username, req.query.password, username, password)){
        res.json({ "status": "err" });
        return;
      }
      const filesToDownload = JSON.parse(req.query.files); // 指定要打包的文件名

      const dir=path.join(sharePath, req.query.dir);

      const zipFileName = path.basename(dir)+".zip";
      const output = fs.createWriteStream(path.join(__dirname, '../extraResources/', zipFileName));
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', function(err) {
        res.status(500).send({ error: err.message });
      });

      filesToDownload.forEach((filename) => {
        const filePath = path.join(dir, filename);
        archive.file(filePath, { name: filename });
      });

      archive.pipe(output);
      archive.finalize();

      // 当输出流关闭时，发送zip文件给客户端
      output.on('close', function() {
        res.download(path.join(__dirname, '../extraResources/', zipFileName), zipFileName, function(err) {
          // 删除生成的zip文件
          fs.unlinkSync(path.join(__dirname, '../extraResources/', zipFileName));
          if (err) {
            console.error(err);
            res.status(500).send('Error during download');
          }
        });
      });

    }else if(req.originalUrl.startsWith('/api/authRequest')){
      // 账户请求
      res.json({"needLogin": username=="" && password=="" ? false : true});
    }else if(req.originalUrl.startsWith('/api/loginRequest')){
      var usernameSHA=req.query.username;
      var passwordSHA=req.query.password;
      res.json({"status": CryptoJS.SHA256(username)==usernameSHA && CryptoJS.SHA256(password)==passwordSHA})
    }else{
      // 否则返回Vue页面
      res.sendFile(path.join(__dirname, '../extraResources/virtual-dir-page/dist', 'index.html'));
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
