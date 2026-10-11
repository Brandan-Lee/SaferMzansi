module.exports = {
	extends: ["expo", "plugin:import/recommended"],
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
				pathGroups: [
					{
						pattern: "react*",
						group: "external",
						position: "before",
					},
					{
						pattern: "@**",
						group: "internal",
						position: "before",
					},
				],
				pathGroupsExcludedImportTypes: ["react"],
				"newlines-between": "always",
				alphabetize: {
					order: "asc",
					caseInsensitive: true,
				},
			},
		],
	},
	settings: {
		"import/resolver": {
			"babel-module": {},
		},
	},
};
