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
  
// 打开服务器函数
ipcMain.on("serverOn", async (event, sharePath, sharePort, username, password) => {
	// 获取依赖
	const http = require('http');
	const fs = require('fs');
	const path = require('path');
	const ejs = require('ejs');

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
					res.writeHead(201);
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
					res.writeHead(201);
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


			// var error;
			var result=await new Promise((resolve)=>{
				req.on('end', async () => {
					const data = JSON.parse(requestBody);
					const delArray = data.delFile;
					for (const item of delArray) {
						const path=pathDel+"/"+item.name;
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
			})

			if(result==true){
				res.writeHead(200);
			}else{
				res.writeHead(201);
			}
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
			// 上面是获取保存路径

			const multer = require('multer');
			const storage = multer.diskStorage({
				destination: pathSave,
				filename: function (req, file, cb) {
					cb(null, Buffer.from(file.originalname, "latin1").toString("utf8"));
				}
			});
			const upload = multer({ storage: storage }).array('files');
			upload(req, res, (err) => {
				if (err) {
					res.writeHead(201);
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
				const filePath = path.join(__dirname, '/../extraResources/',"Error404.html");
				fs.readFile(filePath, 'utf-8', (err, data) => {
					if (err) {
						res.writeHead(500, { 'Content-Type': 'text/plain' });
						console.log(err);
						res.end('Error loading page');
					} else {
						res.writeHead(200, { 'Content-Type': 'text/html' });
						res.end(data);
					}
				});
			} else {
				if (stats.isDirectory()) {
					res.setHeader('Content-Type', 'text/html; charset=utf-8');
					fs.readdir(reqPath, (err, files) => {
						if (err) {
							const filePath = path.join(__dirname, '/../extraResources/', "Error404.html");
							fs.readFile(filePath, 'utf-8', (err, data) => {
								if (err) {
									res.writeHead(500, { 'Content-Type': 'text/plain' });
									console.log(err);
									res.end('Error loading page');
								} else {
									res.writeHead(200, { 'Content-Type': 'text/html' });
									res.end(data);
								}
							});
						} else {
							var dirList=[];
							files.forEach(file => {
								const filePath = path.join(reqPath, file);
								const stats = fs.statSync(filePath);
								if (stats.isFile()) {
									dirList.push({"type":"file","name":file,"size":stats.size,"selected":false});
								} else if (stats.isDirectory()) {
									dirList.push({"type":"dir","name":file,"selected":false});
								}
							});
							const filePath = path.join(__dirname, '/../extraResources/', "DirMain.html");

							fs.readFile(filePath, 'utf-8', (err, template) => { // 读取HTML模板文件
								if (err) {
									res.writeHead(500, { 'Content-Type': 'text/plain' });
									console.log(err);
									res.end('Error loading page');
								} else {
									const compiledTemplate = ejs.render(template, { dirList }); // 使用EJS渲染模板并传递data数组
									res.writeHead(200, { 'Content-Type': 'text/html' });
									res.end(compiledTemplate); // 返回渲染后的HTML内容
								}
							});
						}
					});
					return;
				} else {
					const extension = path.extname(reqPath).toLowerCase();
					const contentType = getContentType(extension);
					const stream = fs.createReadStream(reqPath);
					var fileSize=stats.size;
					res.setHeader("Accept-Ranges","bytes");
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