module.exports = {
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	extends: ["eslint:recommended"],
	plugins: ["react"],
	parserOptions: {
		ecmaVersion: 2022,
		sourceType: "module",
		ecmaFeatures: {
			jsx: true,
		},
	},
	globals: {
		__DEV__: "readonly",
	},
	rules: {
		"no-unused-vars": [
			"error",
			{
				args: "none",
				ignoreRestSiblings: true,
				varsIgnorePattern: "^React$",
			},
		],
		"no-duplicate-imports": "error",
		"no-var": "error",
		"prefer-const": "error",
		"react/jsx-uses-vars": "error",
	},
};
