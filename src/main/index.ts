import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { networkInterfaces } from 'os';
import express from 'express';
import path from 'path';
import http from "http";
import * as CryptoJS from 'crypto-js';
import cors from 'cors';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import archiver from 'archiver';
import multer from 'multer';
import icon from '../../resources/icon.png?asset'

import sharp from 'sharp';
let mainWindow: BrowserWindow;
let expressApp: any;
var sockets: any[] = [];
let server: any;

function createWindow(){
  mainWindow = new BrowserWindow({
    width: 700,
    height: 500,
    show: false,
    title: "Virtual Directory",
    icon: icon,
    autoHideMenuBar: true,
    resizable: false,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    
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
  electronApp.setAppUserModelId('com.zhouc.vd')
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

  // 格式化文件大小显示
  const formatFileSize=(bytes: number)=>{
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 获取后缀名
  const getExt = (fileName: string) => {
    if (!fileName) return undefined; // 处理文件名为 undefined 或 null 的情况
    const parts = fileName.split('.');
    if (parts.length === 1) return undefined; // 如果文件名没有扩展名，则返回 undefined
    return parts.pop()!.toLowerCase(); // 使用非空断言确保 pop() 方法不会返回 undefined
  };

  // 解析文件类型
  const getType=(fileName: string)=>{
    const ext=getExt(fileName);
    if(ext){
      switch (ext){
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
          return 'image';
        case 'xls':
        case 'xlsx':
          return 'xls'
        case 'txt':
        case 'c':
        case 'cpp':
        case 'swift':
        case 'java':
        case 'dart':
        case 'vue':
        case 'css':
        case 'js':
        case 'json':
        case 'md':
        case 'php':
        case 'py':
        case 'ruby':
        case 'cs':
        case 'sql':
        case 'go':
          return 'txt'
        case 'doc':
        case 'docx':
          return 'document';
        case 'html':
          return 'html';
        case 'ppt':
        case 'pptx':
          return 'ppt';
        case '7z':
        case 'rar':
        case 'zip':
        case 'tar':
        case 'gz':
          return 'zip';
        case 'mp3':
        case 'wav':
        case 'ogg':
        case 'flac':
        case 'm4a':
          return 'audio';
        case 'mp4':
        case 'avi':
        case 'mkv':
        case 'mov':
        case 'rmvb':
          return 'video';
        case 'pdf':
          return 'pdf';
        case 'bt':
          return 'bt';
        default:
          return 'other';
      }
    }
    return "";
  }

  // 获取Content内容
  const getContentType=(extension: any)=>{
    const contentType = mime.contentType(extension);
    return contentType || 'application/octet-stream';
  }

  // 登录请求
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

  // 删除文件函数
  async function delFile(path: any) {
    const fs = require('fs').promises;
    try {
      // 执行删除操作
      await fs.rm(path, { recursive: true });
      return true;
    } catch (err) {
      return false;
    }
  }

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

  // 删除路径最后内容
  function removeLastDirectory(filePath: any) {
    return filePath.replace(/[\\\/][^\\\/]+$/, '');
  }

  // 预览图片
  expressApp.get('/api/imgPreview', async(req: any, res: any)=>{
    const name=req.query.username;
    const pass=req.query.password;
    if(loginController(name, pass)){
      const filePath=JSON.parse(decodeURIComponent(req.query.path));
      let dir=path.join(localPath, ...filePath);
      fs.stat(dir, (err, stats) => {
        if (err) {
          res.end("Request ERR");
        } else {
          if (stats.isDirectory()) {
            res.end("Not file");
            return;
          } else {
            // const randomValue = Date.now() + Math.floor(Math.random() * 1000);
            sharp(dir)
            .resize({ width: 80, height: 80, fit: 'inside' })
            .withMetadata()
            .toBuffer((err, buffer) => {
              if (err) {
                console.error(`加载缩略图失败: ${err}`);
                res.status(500).send('加载缩略图失败');
              } else {
                // const compressedImageBase64 = buffer.toString('base64');
                // const dataUrl = `data:image/jpeg;base64,${compressedImageBase64}`;
                
                res.writeHead(200, {
                  'Content-Type': 'image/jpeg',
                  'Content-Length': buffer.length
                });
                res.end(buffer, 'binary');
              }
            });
          }
        }
      });
    }else{
      res.json({
        ok: false,
        data: "用户验证失败"
      });
    }
  })

  // 上传文件
  expressApp.post('/api/upload', async(req: any, res: any)=>{
    const name=req.query.username;
    const pass=req.query.password;
    // Required: 上传地址[path]
    if(loginController(name, pass)){
      const filePath=JSON.parse(decodeURIComponent(req.query.path));
      let dir=path.join(localPath, ...filePath);
      const storage = multer.diskStorage({
        destination: function (_req, _file, cb) {
          const fs = require('fs-extra');
          if(req.query.isDir=='true'){
            dir=removeLastDirectory(dir);
          }
          fs.ensureDirSync(dir);
          cb(null, dir);
        },
        filename: function (_req, file, cb) {
          cb(null, Buffer.from(file.originalname, "latin1").toString("utf8"));
        }
      });
      const upload = multer({ storage: storage }).any();
      upload(req, res, (err) => {
        if (err) {
          console.log(err);
          res.status(400).json({
            ok: false,
            data: "上传出错"
          });
        }
        res.status(200).json({
          ok: true,
          data: ""
        });
      });
    }else{
      res.json({
        ok: false,
        data: "用户验证失败"
      });
    }
  })

  // 删除文件
  expressApp.post('/api/del', async(req: any, res: any)=>{
    const name=req.query.username;
    const pass=req.query.password;
    // Required: 文件地址[path], 文件夹名[items]
    if(loginController(name, pass)){
      const filePath=JSON.parse(decodeURIComponent(req.query.path));
      const dir=path.join(localPath, ...filePath);
      const files=JSON.parse(req.query.items);
      var rlt=await new Promise(async (resolve)=>{
        for(const item of files){
          const path=dir+"/"+item;
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
      res.json({
        ok: rlt,
        data: rlt ? "" : "删除请求失败"
      });
    }else{
      res.json({
        ok: false,
        data: "用户验证失败"
      });
    }
  })

  // 新建文件夹
  expressApp.post('/api/newFolder', async(req: any, res: any)=>{
    const name=req.query.username;
    const pass=req.query.password;
    // Required: 文件地址[path], 文件夹名[name]
    if(loginController(name, pass)){
      const filePath=JSON.parse(decodeURIComponent(req.query.path));
      const dir=path.join(localPath, ...filePath);
      fs.mkdir(dir+"/"+req.query.name, { recursive: true }, (err) => {
				if (err) {
					res.json({
            ok: false,
            data: "新建文件夹请求事变"
          });
				} else {
					res.json({
            ok: true,
            data: ""
          });
				}
			});
    }else{
      res.json({
        ok: false,
        data: "用户验证失败"
      });
    }
  })

  // 重命名
  expressApp.post('/api/rename', async(req: any, res: any)=>{
    const name=req.query.username;
    const pass=req.query.password;
    // Required: 文件地址[path], 原文件名[oldName]， 新文件名[newName]
    if(loginController(name, pass)){
      const filePath=JSON.parse(decodeURIComponent(req.query.path));
      const dir=path.join(localPath, ...filePath);
      fs.rename(dir+"/"+req.query.oldName, dir+"/"+req.query.newName, (err) => {
        if(err){
          res.json({
            ok: false,
            data: "重命名请求失败"
          });
        }else{
          res.json({
            ok: true,
            data: '',
          });
        }
      })
    }else{
      res.json({
        ok: false,
        data: "用户验证失败"
      });
    }
  })
  
  // 多文件下载
  expressApp.get('/api/multidownload', async(req: any, res: any)=>{
    const name=req.query.username;
    const pass=req.query.password;
    // Required: 文件地址[path], 文件[files]
    if(loginController(name, pass)){
      const filePath=JSON.parse(decodeURIComponent(req.query.path));
      const filesToDownload = JSON.parse(req.query.files);
      const dir=path.join(localPath, ...filePath);
      // const zipFileName = filePath.length==0 ? encodeURIComponent(path.basename(localPath)+".zip") : encodeURIComponent(path.basename(dir)+".zip");
      let zipFileName="";
      if(filesToDownload.length==1){
        zipFileName=encodeURIComponent(filesToDownload[0]+".zip");
      }else{
        zipFileName=encodeURIComponent(filesToDownload[0]+"等文件.zip");
      }
      res.setHeader('Content-disposition', `attachment; filename=${zipFileName}`);
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', function(err) {
        res.status(500).send({ error: err.message });
      });
      filesToDownload.forEach((filename: string) => {
        const filePath = path.join(dir, filename);
        if(fs.statSync(filePath).isFile()){
          archive.file(filePath, { name: filename });
        }else{
          const relativePath = path.relative(dir, filePath);
          archive.directory(filePath, relativePath);
        }
      });
      archive.pipe(res);
      archive.finalize();
      res.on('close', function () {
        archive.abort();
      });
    }else{
      res.json({
        ok: false,
        data: "用户验证失败"
      });
    }
  })

  // 单文件下载
  expressApp.get('/api/download', async(req: any, res: any)=>{
    const name=req.query.username;
    const pass=req.query.password;
    const filePath=JSON.parse(decodeURIComponent(req.query.path));
    if(loginController(name, pass)){
      const dir=path.join(localPath, ...filePath);
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
    }else{
      res.json({
        ok: false,
        data: "用户验证失败"
      });
    }
  })

  // 获取文件信息
  expressApp.get('/api/getFile', async(req: any, res: any)=>{
    const name=req.query.username;
    const pass=req.query.password;
    
    const filePath=JSON.parse(decodeURIComponent(req.query.path));
    if(loginController(name, pass)){
      const dir=path.join(localPath, ...filePath);
      fs.stat(dir, (err, stats) => {
        if(err){
          res.json({
            ok: false,
            data: "文件不存在"
          });
        }else{
          if (stats.isDirectory()) {
            res.json({
              ok: false,
              data: "文件不存在"
            });
          }else{
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
      })
    }else{
      res.json({
        ok: false,
        data: "用户验证失败"
      });
    }
  })

  // 获取数据
  expressApp.get('/api/getData', async(req: any, res: any)=>{

    const innerPath=JSON.parse(decodeURIComponent(req.query.path));
    const name=req.query.username;
    const pass=req.query.password;
    
    let dirs: any[]=[];
    if(loginController(name, pass)){
      try {
        // console.log(path.join(localPath, ...innerPath));
        const files=fs.readdirSync(path.join(localPath, ...innerPath));
        files.forEach(async item => {
          const itemPath = path.join(localPath, ...innerPath, item);
          const stats = fs.statSync(itemPath);
          dirs.push({
            id: uuidv4(),
            isFile: stats.isFile(),
            isSelected: false,
            fileName: item,
            size:stats.isFile() ? formatFileSize(stats.size): null,
            type: stats.isFile() ? getType(item) : "dir",
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