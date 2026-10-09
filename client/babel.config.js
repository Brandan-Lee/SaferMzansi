module.exports = function (api) {
	api.cache(true);
	return {
		presets: ["babel-preset-expo"],
		plugins: [
			[
				"module-resolver",
				{
					root: ["./src"],
					alias: {
						"@components": "./src/components",
						"@config": "./src/config",
						"@constants": "./src/constants",
						"@context": "./src/context",
						"@database": "./src/database",
						"@hooks": "./src/hooks",
						"@navigation": "./src/navigation",
						"@screens": "./src/screens",
						"@services": "./src/services",
						"@utils": "./src/utils",
					},
				},
			],
		],
	};
};
