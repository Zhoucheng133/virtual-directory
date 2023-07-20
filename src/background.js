import { BrowserWindow, app, ipcMain, protocol, dialog } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'
const { Menu } = require('electron');  // 引入 Menu 模块

protocol.registerSchemesAsPrivileged([
	{ scheme: 'app', privileges: { secure: true, standard: true } }
])

let win;

// 创建菜单函数（仅macOS系统）
function createMenu() {
	const template = [
		{
			label: 'File',
			submenu: [
				{
					label:"关于",
					role: "about"
				},
				{
					label:"隐藏",
					role:"hide"
				},
				{
					label: '退出',
					accelerator: 'CmdOrCtrl+Q',
					click() {
						app.quit();
					}
				}
			]
		},
		{
			label: '编辑',
			submenu: [
				{ type: 'separator' },
				{
					label: "全选",
					role: 'selectAll'
				},
				{
					label: "重做",
					role: 'redo'
				},
				{ type: 'separator' },
				{
					label: "剪切",
					role: 'cut'
				},
				{
					label: "复制",
					role: 'copy'
				},
				{
					label: "粘贴",
					role: 'paste'
				}
			]
		},
		{
			label: "窗口",
			submenu: [
				{
					label:"最小化",
					role:"minimize"
				},
				{
					label:"缩放",
					role:"zoom",
				}
			]
		}
	];

	const isMac = process.platform === 'darwin';
	const menu = Menu.buildFromTemplate(template);
	if (isMac) {
		Menu.setApplicationMenu(menu);
	} else {
		Menu.setApplicationMenu(null);
	}
}


async function createWindow() {
	const path = require('path');
	win = new BrowserWindow({
		width: 400,
		height: 500,
		resizable: false,
		titleBarStyle: 'hiddenInset',
		frame: false,
		title: "Virtual Directory",
		icon: path.join(__dirname, 'build/icon.png'),
		webPreferences: {
			nodeIntegration:true,
			contextIsolation:false,
			// nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
			// contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
		}
	})
	win.setTitle("Virtual Directory")

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
		if (!process.env.IS_TEST) win.webContents.openDevTools()
	} else {
		createProtocol('app')
		win.loadURL('app://./index.html')
	}
}

app.on('window-all-closed', () => {
	app.quit()
})

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('ready', async () => {
	createWindow();
	createMenu();
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

const mime = require('mime-types');

function getContentType(extension) {
  const contentType = mime.contentType(extension);
  return contentType || 'application/octet-stream';
}

// 验证身份函数
async function isAuthorized(authorizationHeader, username, password) {
	const base64 = require('base-64');
	if (!authorizationHeader || !authorizationHeader.startsWith('Basic ')) {
		return false;
	}

	const credentials = base64.decode(authorizationHeader.substring('Basic '.length));
	const [requestUsername, requestPassword] = credentials.toString('utf-8').split(':');
	const storedUsername = username;
	const storedPassword = password;

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

		if(req.url.startsWith('/.newfolderRequest')){
			const url = new URL("http://localhost:1234"+req.url);
			const paramsStr = url.search.slice(1);
			const params = new URLSearchParams(paramsStr);
			var pathNew="";
			if(sharePath.slice(-1,)=='/'){
				pathNew=sharePath.slice(0,-1)+params.get('path');
			}else{
				pathNew=sharePath+params.get('path');
			}

			fs.mkdir(pathNew+"/"+params.get('name'), { recursive: true }, (err) => {
				if (err) {
					res.writeHead(404);
				} else {
					res.writeHead(200)
				}
			});
		}

		if(req.url.startsWith('/.renameRequest')){
			const url = new URL("http://localhost:1234"+req.url);
			const paramsStr = url.search.slice(1);
			const params = new URLSearchParams(paramsStr);
			var pathReName="";
			if(sharePath.slice(-1,)=='/'){
				pathReName=sharePath.slice(0,-1)+params.get('path');
			}else{
				pathReName=sharePath+params.get('path');
			}

			fs.rename(pathReName+"/"+params.get('oldName'), pathReName+"/"+params.get('newName'), (err) => {
				if (err) {
					res.writeHead(404);
				} else {
					res.writeHead(200);
				}
			});
		}

		if(req.url.startsWith('/.delRequest')){
			const url = new URL("http://localhost:1234"+req.url);
			const paramsStr = url.search.slice(1);
			const params = new URLSearchParams(paramsStr);
			var pathDel="";
			if(sharePath.slice(-1,)=='/'){
				pathDel=sharePath.slice(0,-1)+params.get('path');
			}else{
				pathDel=sharePath+params.get('path');
			}

			let requestBody = '';
			req.on('data', (chunk) => {
				requestBody += chunk.toString();
			});

			req.on('end', () => {
				try {
					const data = JSON.parse(requestBody);
					const delArray = data.delFile;
					var i=0
					for(i=0;i<delArray.length;i++){
						if(delArray[i].type=='file'){
							fs.unlink(pathDel+"/"+delArray[i].name, (err) => {
								if (err) {
									res.writeHead(404);
								}
							});
						}else{
							fs.rmdir(pathDel+"/"+delArray[i].name, { recursive: true }, (err) => {
								if (err) {
									res.writeHead(404);
								}
							});
						}
					}
					if(i==delArray.length){
						res.writeHead(200);
					}
					// console.log(delArray);
				} catch (error) {
					res.writeHead(404);
				}
			});
		}

		if(req.url.startsWith('/.submitRequest')){
			const url = new URL("http://localhost:1234"+req.url);
			const paramsStr = url.search.slice(1);
			const params = new URLSearchParams(paramsStr);
			var pathSave="";
			if(sharePath.slice(-1,)=='/'){
				pathSave=sharePath.slice(0,-1)+params.get('path');
			}else{
				pathSave=sharePath+params.get('path');
			}

			const multer = require('multer');
			const storage = multer.diskStorage({
				destination: pathSave,
				filename: function (req, file, cb) {
					cb(null, Buffer.from(file.originalname, "latin1").toString("utf8"));
				}
			});
			const upload = multer({ storage: storage });
			upload.single('file')(req, res, (err) => {
				if (err) {
					res.writeHead(404);
					// return res.end('Error uploading file.');
				}

				if (req.file) {
					// console.log('File uploaded:', req.file);
					res.writeHead(200);
					// return;
				}
			});

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
								<script src="https://unpkg.com/vue-contextmenujs/dist/contextmenu.umd.js"></script>
								<script src="https://unpkg.com/axios/dist/axios.min.js"></script>
								<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
								<link rel="stylesheet" href="https://unpkg.com/element-ui/lib/theme-chalk/index.css">
								<script src="https://unpkg.com/element-ui/lib/index.js"></script>
							</head>
							<body>
								<div id="app" :style="flexContent==true?{'display':'flex','flex-direction':'column','align-items': 'center'}:{}" @contextmenu.prevent.stop="onContextmenu('')">
									<div>
										<div class="title">
											Virtual Directory
										</div>
										<div class="head" :style="{width:tableWidth+'px'}">
											当前路径：<br/>{{getPath()}}
										</div>
										<div class="toolBar">
											<form method="post" enctype="multipart/form-data" @change="handleFileChange">
												<input type="file" name="file" id="fileInput" ref="fileInput" style="display: none;">
												<div class="uploadButton" @click="uploadFile">上传</div>
											</form>
											<div class="folderButton" @click="handleNewFolder">新建文件夹</div>
											<div :class="selectedItem.length==1?'renameButton':'noSelection'" @click="handleRename(selectedItem[0].name)">重命名</div>
											<div :class="selectedItem.length==0?'noSelection':'delButton'" @click="handleDel">删除</div>
										</div>
										<div class="container" :style="{width:tableWidth+'px'}">
											<div class="backFolder_style row" v-if="isRoot()==false" @click="backFolder">
												<div class="cell"></div>
												<div class="cell"><i class="bi bi-folder mainIcon"></i></div>
												<div class="cell">../</div>
												<div class="cell cell_end">上一层</div>
											</div>
											<div :class="isSelected(item)?'selected row':'row'" v-for="item in list" v-if="item.name[0]!='.'" @contextmenu.prevent.stop="onContextmenu(item)">
												<div class="checkBox cell">
													<el-checkbox @change="selectItem(item)"></el-checkbox>
												</div>
												<div class="cell"  @click="linkTO(item)">
													<i class="bi bi-folder mainIcon" v-if="item.type=='dir'"></i>
													<i class="bi bi-file-earmark-image mainIcon" v-else-if="
														(comp(item.name,'jpg') || 
														comp(item.name,'jpeg') ||
														comp(item.name,'png') || 
														comp(item.name,'tiff') ||
														comp(item.name,'psd') ||
														comp(item.name,'gif') ||
														comp(item.name,'tif') ||
														comp(item.name,'ai') ||
														comp(item.name,'svg') ||
														comp(item.name,'dng')) && item.type!='dir'">
													</i>
													<i class="bi bi-file-play mainIcon" v-else-if="
														(comp(item.name,'mp4') || 
														comp(item.name,'mov') || 
														comp(item.name,'mkv') ||
														comp(item.name,'avi') ||
														comp(item.name,'rmvb')) && item.type!='dir'">
							
													</i>
													<i class="bi bi-file-earmark-music mainIcon" v-else-if="
														(comp(item.name,'mp3') || 
														comp(item.name,'acc') || 
														comp(item.name,'flac') ||
														comp(item.name,'m4p') ||
														comp(item.name,'wav') ||
														comp(item.name,'mid') ||
														comp(item.name,'midi')) && item.type!='dir'">
							
													</i>
													<i class="bi bi-file-text mainIcon" v-else-if="
														(comp(item.name,'txt') || 
														comp(item.name,'doc') || 
														comp(item.name,'docx') ||
														comp(item.name,'md') ||
														comp(item.name,'rtf')) && item.type!='dir'">
													</i>
													<i class="bi bi-file-earmark-slides mainIcon" v-else-if="
														(comp(item.name,'ppt') || 
														comp(item.name,'key') || 
														comp(item.name,'pptx')) && item.type!='dir'">
													</i>
													<i class="bi-file-earmark-bar-graph mainIcon" v-else-if="
														(comp(item.name,'xls') || 
														comp(item.name,'xlsx') || 
														comp(item.name,'numbers')) && item.type!='dir'">
													</i>
													<i class="bi bi-file-earmark-code mainIcon" v-else-if="
														(comp(item.name,'cpp') || 
														comp(item.name,'c') || 
														comp(item.name,'py') ||
														comp(item.name,'cs') ||
														comp(item.name,'swfit') ||
														comp(item.name,'js') ||
														comp(item.name,'java') ||
														comp(item.name,'json') ||
														comp(item.name,'vue') ||
														comp(item.name,'css') ||
														comp(item.name,'go') ||
														comp(item.name,'sql') ||
														comp(item.name,'vb') ||
														comp(item.name,'rs') ||
														comp(item.name,'xml') ||
														comp(item.name,'kt') ||
														comp(item.name,'yaml') ||
														comp(item.name,'ts') || 
														comp(item.name,'html') ||
														comp(item.name,'csv') ||
														comp(item.name,'sh') ||
														comp(item.name,'sass') ||
														comp(item.name,'scss') ||
														comp(item.name,'yml')) && item.type!='dir'">
													</i>
													<i class="bi bi-file-earmark-pdf mainIcon" v-else-if="
														comp(item.name,'pdf') && item.type!='dir'">
													</i>
													<i class="bi bi-file-zip mainIcon" v-else-if="
														(comp(item.name,'zip') || 
														comp(item.name,'rar') || 
														comp(item.name,'7z') ||
														comp(item.name,'tar') ||
														comp(item.name,'iso') ||
														comp(item.name,'dmg')) && item.type!='dir'">
													</i>
													<i class="bi bi-file-earmark-post mainIcon" v-else-if="
														comp(item.name,'exe') && item.type!='dir'">
													</i>
													<i class="bi bi-file-earmark mainIcon" v-else></i>
												</div>
												<div class="cell"  @click="linkTO(item)">{{ item.name }}</div>
												<div class="cell cell_end" v-if="item.type=='file'" style="text-align: right"  @click="linkTO(item)">
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
										tableWidth:320,
										flexContent:true,
										selectedItem:[],
										list: ${JSON.stringify(dirList)},
									},
									methods: {
										async handleDel() {
											try {
												await this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
													confirmButtonText: '确定',
													cancelButtonText: '取消',
													type: 'warning'
												}).then(() => {
												})
												const response = await axios.post('/.delRequest?path='+this.getPath(),{
													delFile: this.selectedItem,
												});
												if(response.status==200){
													// console.log("成功");
													location.reload();
												}else{
													// console.log("失败");
												}
											} catch (error) {
											}
							
										},
										async handleRename(fileName) {
											try {
												var fileList=[];
												var newName = "";
												await this.$prompt('在下面输入新的文件/文件夹名称', '输入新名称', {
													confirmButtonText: '确定',
												}).then(({ value }) => {
													newName = value;
													fileList=this.list.map(obj => obj.name);
												});
												if(newName.slice(0,1)=='.'){
													this.$message.error("不合法的名称")
												}else if(newName!=""&&newName!=null){
													if(!fileList.includes(newName)){
														const response = await axios.post('/.renameRequest?path=' + this.getPath() +"&oldName="+fileName + "&newName=" + newName);
														if (response.status === 200) {
															location.reload();
														} else {
															// 处理其他状态码
														}
													}else{
														this.$message.error("目录中已有同名文件/文件夹")
													}
												}else{
													this.$message.error("名称不能为空")
												}
											} catch (error) {
											}
										},
										async handleNewFolder(){
											try {
												var fileList=[];
												var newName = "";
												await this.$prompt('在下面输入新建文件夹名称', '输入新名称', {
													confirmButtonText: '确定',
												}).then(({ value }) => {
													newName = value;
													fileList=this.list.map(obj => obj.name);
												});
												if(newName.slice(0,1)=='.'){
													this.$message.error("不合法的名称")
												}else if(newName!=""&&newName!=null){
													if(!fileList.includes(newName)){
														const response = await axios.post('/.newfolderRequest?path='+this.getPath()+"&name="+newName);
														if (response.status === 200) {
															location.reload();
														} else {
															// 处理其他状态码
														}
													}else{
														this.$message.error("目录中已有同名文件/文件夹")
													}
												}else{
													this.$message.error("名称不能为空")
												}
											} catch (error) {
											}
										},
										async handleFileChange(event) {
											const files = event.target.files;
											const loading = this.$loading({
												lock: true,
												text: '正在上传中',
												spinner: 'el-icon-loading',
												background: 'rgba(255, 255, 255, 0.7)'
											});
							
											if (files.length > 0) {
												const file = files[0];
												const formData = new FormData();
												const fileName = file.name;
												formData.append('file', file);
							
												try {
													const response = await axios.post('/.submitRequest?path='+this.getPath(), formData, {
														headers: {
															'Content-Type': 'multipart/form-data'
														}
													});
													// console.log(response.status);
													if(response.status==200){
														loading.close();
														location.reload();
													}else{
														// console.log("失败");
													}
												} catch (error) {
													console.error(error);
												}
											}
										},
										uploadFile(){
											this.$refs.fileInput.click();
										},
										isSelected(item){
											return (this.selectedItem.includes(item));
										},
										selectItem(item){
											if(this.selectedItem.includes(item)){
												this.selectedItem.splice(this.selectedItem.indexOf(item), 1)
											}else{
												this.selectedItem.push(item)
											}
										},
										onContextmenu(item){
											this.$contextmenu({
												items: [
													{
														label: "打开",
														icon: "bi-file-arrow-down",
														disabled: item==''?true:false,
														onClick: () => {
															this.linkTO(item)
														}
													},
													{
														label: "刷新",
														icon: "bi-arrow-clockwise",
														onClick: ()=>{
															location.reload();
														}
													},
													{
							
													}
												],
												event,
												customClass: "custom-class",
												zIndex: 3,
												minWidth: 150
											});
											return false;
										},
										comp(str,extensionName){
											str=String(str).toLowerCase();
											extensionLength=extensionName.length;
											if(str[str.length-extensionLength-1]!="."){
												return false;
											}
											if(str.substring(str.length-extensionLength)==extensionName){
												return true;
											}else{
												return false;
											}
										},
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
										if(window.innerWidth<340){
											this.flexContent=false;
											this.tableWidth=320;
										}else if(window.innerWidth<740){
											this.tableWidth=window.innerWidth-40;
											this.flexContent=false;
										}else{
											this.tableWidth=700;
											this.flexContent=true;
										}
									},
									mounted() {
										window.onresize=()=>{
											if(window.innerWidth<340){
												this.flexContent=false;
												this.tableWidth=320;
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
								.el-button:hover{
									color: rgb(255, 132, 0);
									background-color: rgb(255, 219, 180);
									border-color: rgb(255, 180, 100);
								}
								.el-button--primary:hover{
									color: white !important;
									background-color: rgb(193, 100, 0) !important;
									border-color:rgb(193, 100, 0) !important;
								}
								.el-button{
									transition: all ease-in-out .2s !important;
								}
								.el-button--primary{
									background-color: rgb(255, 132, 0) !important;
									border-color:rgb(255, 132, 0) !important;
								}
								.el-input.is-active .el-input__inner, .el-input__inner:focus{
									border-color:rgb(255, 132, 0) !important;
								}
								.el-loading-spinner i{
									color: rgb(255, 132, 0);
								}
								.el-loading-spinner .el-loading-text{
									color: rgb(255, 132, 0);
								}
								.el-checkbox__input.is-checked .el-checkbox__inner, .el-checkbox__input.is-indeterminate .el-checkbox__inner{
									border-color: rgb(255, 132, 0);
									background-color: rgb(255, 132, 0);
								}
								.el-checkbox__inner:hover{
									border-color: rgb(255, 132, 0);
								}
								.el-checkbox__input.is-focus .el-checkbox__inner{
									border-color: rgb(255, 132, 0);
								}
								.folderButton:hover{
									color: rgb(193, 100, 0);
									cursor: pointer;
								}
								.folderButton{
									margin-left: 15px;
									color: rgb(255, 132, 0);
									transition: all ease-in-out .2s;
								}
								.selected:hover{
									color: rgb(255, 132, 0);
									cursor: pointer;
								}
								.selected{
									background-color: rgb(235, 235, 235);
									display: grid;
									grid-template-columns: 30px auto 100px;
									padding: 2px 2px 2px 2px;
									border-radius: 10px;
									transition: all ease-in-out .2s;
								}
								.noSelection:hover{
									cursor: not-allowed;;
								}
								.noSelection{
									margin-left: 15px;
									color: grey;
									transition: all ease-in-out .2s;
								}
								.renameButton:hover{
									color: rgb(193, 100, 0);
									cursor: pointer;
								}
								.renameButton{
									margin-left: 15px;
									color: rgb(255, 132, 0);
									transition: all ease-in-out .2s;
								}
								.delButton:hover{
									color: darkred;
									cursor: pointer;
								}
								.delButton{
									margin-left: 15px;
									color: red;
									transition: all ease-in-out .2s;
								}
								.uploadButton:hover{
									background-color: rgb(193, 100, 0);
									cursor: pointer;
								}
								.uploadButton{
									background-color: rgb(255, 132, 0);
									padding: 5px;
									padding-left: 10px;
									padding-right: 10px;
									color: white;
									border-radius: 5px;
									transition: all ease-in-out .2s;
								}
								.toolBar{
									display: flex;
									align-items: center;
									/* padding-left: 10px; */
									height: 50px;
									width: 100%;
									/* background-color: red; */
									padding-top: 5px;
									padding-bottom: 10px;
								}
								.menu_item__available:hover{
									background-color: rgb(255, 238, 220) !important;
									color: rgb(255, 132, 0) !important;
								}
								.container {
									display: grid;
									/* grid-template-columns: 30px auto 100px; */
								}
								.row:hover{
									color: rgb(255, 132, 0);
									cursor: pointer;
									background-color: rgb(245, 245, 245);
								}
								.row {
									display: grid;
									grid-template-columns: 30px 30px auto 100px;
									transition: all ease-in-out .2s;
									padding: 2px 2px 2px 2px;
									border-radius: 10px;
									
								}
								.cell_end{
									justify-content: flex-end;
								}
								.cell {
									padding: 5px;
									word-wrap: break-word;
									word-break: break-all;
									display: flex;
									align-items: center;
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
									word-wrap: break-word;
									word-break: break-all;
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
					var fileSize=stats.size;
					res.setHeader('Content-Length', fileSize);
					res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(path.basename(reqPath))}`);
					res.setHeader('Content-Type', contentType);
					stream.pipe(res);
				}
			}
		});
	});

	server.on('error', (error) => {
		event.reply('serverOnResponse', 'error');
		return;
	});

	server.on("connection", function (socket) {
		sockets.push(socket);
		socket.once("close", function () {
			sockets.splice(sockets.indexOf(socket), 1);
		});
	});

	server.listen(sharePort, () => {
		event.reply('serverOnResponse', 'success');
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
		event.reply('serverOffResponse', 'error');
	}
	event.reply('serverOffResponse', 'success');
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