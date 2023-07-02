const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
	transpileDependencies: true,
	pluginOptions: {
		electronBuilder: {
			nodeIntegration: true,
		},
	},
	configureWebpack:{
		externals: {
			"fs": 'require("fs")',
			"path": 'require("path")',
		},
	}
})
