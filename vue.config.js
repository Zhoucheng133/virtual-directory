const { defineConfig } = require('@vue/cli-service')
process.env.VUE_APP_VERSION = require('./package.json').version
module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
		electronBuilder: {
			nodeIntegration: true,
			builderOptions: {
				"extraResources": ["./ui_interface/**"],
				artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
				mac: {
					target: {
						arch: ['x64', 'arm64'],
						target: 'zip'
					}
				}
			},
		},
	},
})
