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

let server

ipcMain.on("serverOn", async (event, sharePath, sharePort) => {
	// 获取依赖
	const http = require('http');
	const fs = require('fs');
	const path = require('path');
	
	server = http.createServer((req, res) => {
		const reqPath=path.join(sharePath,decodeURIComponent(req.url));

		fs.stat(reqPath,(err,stats)=>{
			if(err){
				res.statusCode=404;
				res.end("错误404");
			}else{
				if(stats.isDirectory()){
					res.end("这是一个目录");
				}else{
					const stream=fs.createReadStream(reqPath);
					res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(path.basename(reqPath))}"`);
					stream.pipe(res);
				}
			}
		})
	});

	server.listen(sharePort,()=>{
		event.reply('serverOnResponse', 'Success');
	});
});

ipcMain.on("serverOff",async (event)=>{
	try {
		server.close();
	} catch (error) {
		event.reply('serverOffResponse', 'Error');
	}
	event.reply('serverOffResponse', 'Success');
});