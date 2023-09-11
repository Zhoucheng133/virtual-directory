module.exports = {
	transpileDependencies: true,
	pluginOptions: {
		electronBuilder: {
			nodeIntegration: true,
			builderOptions: {
				"extraResources": ["./extraResources/**"],
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
}
