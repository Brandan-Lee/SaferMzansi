//Load environment variables at the top
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const authRouter = require("./routes/auth");

app.use("/api/users", authRouter);

app.get("/api/health", (req, res) => {
	res.json({ status: "ok", message: "SaferMzansi Node server running!" });
});

app.listen(PORT, "0.0.0.0", () => {
	console.log(`Server running on http://localhost:${PORT}`);
});