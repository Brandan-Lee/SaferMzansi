module.exports = {
	env: {
		node: true,
		es2020: true,
	},
	parserOptions: {
		ecmaVersion: 2020,
	},
	extends: ["eslint:recommended", "plugin:import/recommended"],
	plugins: ["import"],
	rules: {
		"import/order": [
			"error",
			{
				groups: [
					"builtin",
					"external",
					"internal",
					["parent", "sibling", "index"],
				],
				"newlines-between": "always",
				alphabetize: { order: "asc", caseInsensitive: true },
			},
		],
	},
};
