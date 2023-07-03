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
										<title>Virtual Dir</title>
										<script src="https://cdn.jsdelivr.net/npm/vue@2"></script>
									</head>
									<body>
										<div id="app">
											<div v-for="item in list">
												<li v-if="item.name[0]!='.'">
													{{ item.name }}
												</li>
											</div>
										</div>
									</body>
									
									<script>
										var app = new Vue({
											el: '#app',
											data: {
												list: ${JSON.stringify(dirList)}
											}
									  	})
									</script>

									<style>
									#app{
										user-select: none;
									}
									</style>
									</html>
								`);
							}
						});
						return;
					});
				} else {
					const stream = fs.createReadStream(reqPath);
					res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(path.basename(reqPath))}"`);
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