import { BrowserWindow, app, ipcMain, protocol } from 'electron'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'

protocol.registerSchemesAsPrivileged([
	{ scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
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

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('ready', async () => {
	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		try {
			await installExtension(VUEJS_DEVTOOLS)
		} catch (e) {
			console.error('Vue Devtools failed to install:', e.toString())
		}
	}
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

const mime = require('mime-types');

function getContentType(extension) {
  const contentType = mime.contentType(extension);
  return contentType || 'application/octet-stream';
}

let server;
var sockets = [];

// 打开服务器函数
ipcMain.on("serverOn", async (event, sharePath, sharePort) => {
	// 获取依赖
	const http = require('http');
	const fs = require('fs');
	const path = require('path');

	server = http.createServer((req, res) => {
		const reqPath = path.join(sharePath, decodeURIComponent(req.url));

		fs.stat(reqPath, (err, stats) => {
			if (err) {
				res.end(`
					<!DOCTYPE html>
					<html lang="zh-cn">
					<head>
						<meta charset="UTF-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Document</title>
					</head>
					<body>
						没有找到文件
					</body>
					</html>
				`)
			} else {
				if (stats.isDirectory()) {
					fs.readFile("src/components/DirMain.html", "utf8", (err, data) => {
						res.setHeader('Content-Type', 'text/html; charset=utf-8');
						fs.readdir(reqPath, (err, files) => {
							if (err) {
								res.end(`
									<!DOCTYPE html>
									<html lang="zh-cn">
									<head>
										<meta charset="UTF-8">
										<meta name="viewport" content="width=device-width, initial-scale=1.0">
										<title>Document</title>
									</head>
									<body>
										读取目录出错
									</body>
									</html>
								`)
							} else {
								var dirList=[];
								files.forEach(file => {
									const filePath = path.join(reqPath, file);
									const stats = fs.statSync(filePath);
									if (stats.isFile()) {
										dirList.push({"type":"file","name":file,"size":stats.size});
									} else if (stats.isDirectory()) {
										dirList.push({"type":"dir","name":file})
									}
								});
								console.log(dirList);

								res.end(`
								<!DOCTYPE html>
								<html lang="zh-cn">
								
								<head>
									<meta charset="UTF-8">
									<meta name="viewport" content="width=device-width, initial-scale=1.0">
									<link rel="stylesheet" href="https://unpkg.com/element-ui/lib/theme-chalk/index.css">
									<title>Virtual Directory</title>
									<script src="https://cdn.jsdelivr.net/npm/vue@2"></script>
									<script src="https://unpkg.com/element-ui/lib/index.js"></script>
								</head>
								
								<body>
									<div id="app">
										<table>
											<tr v-if="isRoot()==false" class="backFolder_style" @click="backFolder">
												<td><i class="el-icon-folder mainIcon"></i></td>
												<td>../</td>
												<td>上一层</td>
											</tr>
											<tr v-for="item in list" v-if="item.name[0]!='.'" @click="linkTO(item)">
												<td width="30px">
													<i class="el-icon-folder mainIcon" v-if="item.type=='dir'"></i>
													<i class="el-icon-tickets mainIcon" v-else></i>
												</td>
												<td>
													{{ item.name }}
												</td>
												<td v-if="item.type=='file'" width="100px">
													{{ shownSize(item.size) }}
												</td>
											</tr>
										</table>
									</div>
								</body>
								
								<script>
									var app = new Vue({
										el: '#app',
										data: {
											list: ${JSON.stringify(dirList)}
										},
										methods: {
											getPath(){
												return  window.location.pathname;
											},
											backFolder(){
												const currentURL = window.location.href;
												const parentURL = currentURL.substring(0, currentURL.lastIndexOf('/'));
												window.location.href = parentURL;
											},
											isRoot(){
												if(window.location.origin==window.location.href){
													return true;
												}else if(window.location.origin+'/'==window.location.href){
													return true;
												}
												return false;
											},
											linkTO(item){
												var nowURL=window.location.href;
												nowURL+="/"
												nowURL+=item.name;
												window.location.href=nowURL;
											},
											shownSize(size){
												if(size/1024>1){
													size=size/1024;
												}else{
													return size.toFixed(2)+" B"
												}
												if(size/1024>1){
													size=size/1024;
												}else{
													return size.toFixed(2)+" KB"
												}
												if(size/1024>1){
													size=size/1024;
												}else{
													return size.toFixed(2)+" MB"
												}
												if(size/1024>1){
													size=size/1024;
												}else{
													return size.toFixed(2)+" GB"
												}
												return size.toFixed(2)+" GB"
											}
										},
									})
								</script>
								
								<style>
									.backFolder_style:hover{
										color: rgb(255, 150, 0);
										cursor: pointer;
									}
									.backFolder_style{
										color: rgb(165, 165, 165);
										transition: all ease-in-out .2s;
									}
									tr{
										transition: all ease-in-out .2s;
									}
									tr:hover{
										color: rgb(255, 150, 0);
										cursor: pointer;
									}
									.mainIcon{
										font-size: 18px;
									}
									td{
										/* border: 1px solid; */
										padding: 5px 5px 5px 5px;
									}
									table{
										width: 1000px;
										/* border: 1px solid; */
									}
									#app {
										display: flex;
										flex-direction: column;
										align-items: center;
										user-select: none;
										font-family: Avenir, Helvetica, Arial, sans-serif;
										-webkit-font-smoothing: antialiased;
										-moz-osx-font-smoothing: grayscale;
										color: #2c3e50;
									}
								</style>
								
								</html>
								`);
							}
						});
						return;
					});
				} else {
					const extension = path.extname(reqPath).toLowerCase();
					const contentType = getContentType(extension);
					const stream = fs.createReadStream(reqPath);
					res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(path.basename(reqPath))}"`);
					res.setHeader('Content-Type', contentType);
					stream.pipe(res);
				}
			}
		});
	});

	server.on("connection", function (socket) {
		sockets.push(socket);
		socket.once("close", function () {
			sockets.splice(sockets.indexOf(socket), 1);
		});
	});	  

	server.listen(sharePort, () => {
		event.reply('serverOnResponse', 'Success');
	});
});

// 关闭服务器函数
ipcMain.on("serverOff", async (event) => {
	sockets.forEach(function(socket){
		socket.destroy();
	});
	if (server) {
		server.close();
	} else {
		event.reply('serverOffResponse', 'Error');
	}
	event.reply('serverOffResponse', 'Success');
});