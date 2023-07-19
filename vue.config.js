module.exports = {
	transpileDependencies: true,
	pluginOptions: {
		electronBuilder: {
			nodeIntegration: true,
			builderOptions: {
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
	// configureWebpack:{
	// 	externals: {
	// 		"fs": 'require("fs")',
	// 		"path": 'require("path")',
	// 	},
	// }
}
