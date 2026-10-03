//Load environment variables at the top
require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const crypto = require("crypto");
const PORT = process.env.PORT || 8080;
app.use(cors());
app.use(bodyParser.json()); //Email sending route requires body-parser to parse the request body
app.use(express.json());

const authRouter = require("./src/routes/auth");
const otpRouter = require("./src/routes/otpRoutes");

app.use("/api/users", authRouter);
app.use("/api/otp", otpRouter);

app.get("/api/health", (req, res) => {
	res.json({ status: "ok", message: "SaferMzansi Node server running!" });
});

app.listen(PORT, "0.0.0.0", () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
