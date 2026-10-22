// Load settings before the app and its route modules are imported.
require("dotenv").config();

const app = require("./src/app");
const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
