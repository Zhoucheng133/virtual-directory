import { BrowserWindow, app, ipcMain, protocol } from 'electron'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'

protocol.registerSchemesAsPrivileged([
	{ scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
	const win = new BrowserWindow({
		width: 400,
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

async function isAuthorized(authorizationHeader, username, password) {
	const base64 = require('base-64');
	if (!authorizationHeader || !authorizationHeader.startsWith('Basic ')) {
		return false;
	}

	const credentials = base64.decode(authorizationHeader.substring('Basic '.length));
	const [requestUsername, requestPassword] = credentials.toString('utf-8').split(':');
	const storedUsername = username;
	const storedPassword = password;

	console.log(requestUsername+"#"+storedUsername);
	console.log(requestPassword+"#"+storedPassword);
	console.log(requestUsername === storedUsername && requestPassword === storedPassword);

	return requestUsername === storedUsername && requestPassword === storedPassword;
}

let server;
var sockets = [];

// 打开服务器函数
ipcMain.on("serverOn", async (event, sharePath, sharePort, username, password) => {
	// 获取依赖
	const http = require('http');
	const fs = require('fs');
	const path = require('path');

	var needLogin=true;
	if(username=="" && password==""){
		needLogin=false;
	}

	server = http.createServer(async (req, res) => {
		const reqPath = path.join(sharePath, decodeURIComponent(req.url));

		if(needLogin){
			const authHeader = req.headers.authorization;
	
			if (await isAuthorized(authHeader,username,password) === false) {
				res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Restricted Area"' });
				res.end('Unauthorized');
				return;
			}
		}

		fs.stat(reqPath, (err, stats) => {
			if (err) {
				res.end(`
				<!DOCTYPE html>
				<html lang="zh-cn">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Virtual Directory</title>
					<script src="https://cdn.jsdelivr.net/npm/vue@2"></script>
				</head>
				<body>
					<div id="app">
						<div class="mainTip">错误：找不到目录或文件</div>
						<div class="smallTip" @click="backToHome()">返回到主页</div>
					</div>
				</body>

				<script>
					var app = new Vue({
						el: '#app',
						data: {
							
						},
						methods: {
							backToHome(){
								window.location.href=window.location.origin;
							}
						},
					})
				</script>

				<style>
					body{
						margin: 0;
					}
					.smallTip:hover{
						color: rgb(255, 150, 0);
						cursor: pointer;
					}
					.smallTip{
						transition: all ease-in-out .2s;
						margin-top: 10px;
					}
					.mainTip{
						font-size: 20px;
					}
					#app {
						padding-top: 10px;
						padding-left: 10px;
						user-select: none;
						font-family: Avenir, Helvetica, Arial, sans-serif;
						-webkit-font-smoothing: antialiased;
						-moz-osx-font-smoothing: grayscale;
						color: #2c3e50;
						margin: 0;
					}
				</style>
				</html>
				`)
			} else {
				if (stats.isDirectory()) {
					res.setHeader('Content-Type', 'text/html; charset=utf-8');
					fs.readdir(reqPath, (err, files) => {
						if (err) {
							res.end(`
							<!DOCTYPE html>
							<html lang="zh-cn">
							<head>
								<meta charset="UTF-8">
								<meta name="viewport" content="width=device-width, initial-scale=1.0">
								<title>Virtual Directory</title>
								<script src="https://cdn.jsdelivr.net/npm/vue@2"></script>
							</head>
							<body>
								<div id="app">
									<div class="mainTip">错误：读取目录或文件失败</div>
									<div class="smallTip" @click="backToHome()">返回到主页</div>
								</div>
							</body>

							<script>
								var app = new Vue({
									el: '#app',
									data: {
										
									},
									methods: {
										backToHome(){
											window.location.href=window.location.origin;
										}
									},
								})
							</script>

							<style>
								body{
									margin: 0;
								}
								.smallTip:hover{
									color: rgb(255, 150, 0);
									cursor: pointer;
								}
								.smallTip{
									transition: all ease-in-out .2s;
									margin-top: 10px;
								}
								.mainTip{
									font-size: 20px;
								}
								#app {
									padding-top: 10px;
									padding-left: 10px;
									user-select: none;
									font-family: Avenir, Helvetica, Arial, sans-serif;
									-webkit-font-smoothing: antialiased;
									-moz-osx-font-smoothing: grayscale;
									color: #2c3e50;
									margin: 0;
								}
							</style>
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
								<div id="app" :style="flexContent==true?{'display':'flex','flex-direction':'column','align-items': 'center'}:{}">
									<div>
										<div class="title">
											Virtual Directory
										</div>
										<div class="head" :style="{width:tableWidth+'px'}">
											当前路径：<br/>{{getPath()}}
										</div>
										<div class="container" :style="{width:tableWidth+'px'}">
											<div class="backFolder_style row" v-if="isRoot()==false" @click="backFolder">
												<div class="cell"><i class="el-icon-folder mainIcon"></i></div>
												<div class="cell">../</div>
												<div class="cell" style="text-align: right">上一层</div>
											</div>
											<div class="row" v-for="item in list" v-if="item.name[0]!='.'" @click="linkTO(item)">
												<div class="cell">
													<i class="el-icon-folder mainIcon" v-if="item.type=='dir'"></i>
													<i class="el-icon-tickets mainIcon" v-else></i>
												</div>
												<div class="cell">{{ item.name }}</div>
												<div class="cell" v-if="item.type=='file'" style="text-align: right">
													{{ shownSize(item.size) }}
												</div>
											</div>
										</div>
									</div>
									<div class=blank></div>
								</div>
							</body>
							
							<script>
								var app = new Vue({
									el: '#app',
									data: {
										tableWidth:340,
										flexContent:true,
										list: ${JSON.stringify(dirList)},
									},
									methods: {
										getPath() {
											return decodeURIComponent(window.location.pathname);
										},
										backFolder() {
											const currentURL = window.location.href;
											const parentURL = currentURL.substring(0, currentURL.lastIndexOf('/'));
											window.location.href = parentURL;
										},
										isRoot() {
											if (window.location.origin == window.location.href) {
												return true;
											} else if (window.location.origin + '/' == window.location.href) {
												return true;
											}
											return false;
										},
										linkTO(item) {
											if (this.isRoot()) {
												var url = window.location.origin + '/';
												url += item.name;
												window.location.href = url;
												return;
											}
											var nowURL = window.location.href;
											nowURL += "/"
											nowURL += item.name;
											window.location.href = nowURL;
										},
										shownSize(size) {
											if (size / 1024 > 1) {
												size = size / 1024;
											} else {
												return size.toFixed(2) + " B"
											}
											if (size / 1024 > 1) {
												size = size / 1024;
											} else {
												return size.toFixed(2) + " KB"
											}
											if (size / 1024 > 1) {
												size = size / 1024;
											} else {
												return size.toFixed(2) + " MB"
											}
											if (size / 1024 > 1) {
												size = size / 1024;
											} else {
												return size.toFixed(2) + " GB"
											}
											return size.toFixed(2) + " GB"
										}
									},
									created() {
										if(window.innerWidth<380){
											this.flexContent=false;
											this.tableWidth=340;
										}else if(window.innerWidth<740){
											this.tableWidth=window.innerWidth-40;
											this.flexContent=false;
										}else{
											this.tableWidth=700;
											this.flexContent=true;
										}
										console.log(this.tableWidth);
									},
									mounted() {
										window.onresize=()=>{
											if(window.innerWidth<380){
												this.flexContent=false;
												this.tableWidth=340;
											}else if(window.innerWidth<740){
												this.tableWidth=window.innerWidth-40;
												this.flexContent=false;
											}else{
												this.tableWidth=700;
												this.flexContent=true;
											}
										}
									},
								})
							</script>
							
							<style>
								.container {
									display: grid;
									/* grid-template-columns: 30px auto 100px; */
								}
								.row {
									display: grid;
									grid-template-columns: 30px auto 100px;
									transition: all ease-in-out .2s;
								}
								.cell {
									padding: 5px;
									word-wrap: break-word;
									word-break: break-all;
								}
								.blank{
									width: 100%;
									height: 20px;
								}
								.title{
									padding-top:20px;
								}
								body {
									margin: 0;
								}
								.head {
									text-align: left;
									font-size: 26px;
									word-wrap: break-word;
									margin-bottom: 10px;
								}
								.row:hover{
									color: rgb(255, 132, 0);
									cursor: pointer;
								}
								.backFolder_style:hover {
									color: rgb(255, 132, 0);
									cursor: pointer;
								}
								.backFolder_style {
									color: rgb(165, 165, 165);
									transition: all ease-in-out .2s;
								}
								.mainIcon {
									font-size: 18px;
								}
								#app {
									padding-left: 20px;
									padding-right: 20px;
									user-select: none;
									font-family: Avenir, Helvetica, Arial, sans-serif;
									-webkit-font-smoothing: antialiased;
									-moz-osx-font-smoothing: grayscale;
									color: #2c3e50;
									min-height: 100vh;
									margin: 0;
								}
							</style>
							</html>
							`);
						}
					});
					return;
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