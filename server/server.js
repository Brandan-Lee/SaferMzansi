// Load environment variables at the top
require("dotenv").config();

const cors = require("cors");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json()); // Built-in Express JSON parser

// Import Routers
const authRouter = require("./src/routes/auth");
const contactRouter = require("./src/routes/contacts");
const otpRouter = require("./src/routes/otpRoutes");
const userRouter = require("./src/routes/users");

// Health Check Endpoint
app.get("/api/health", (req, res) => {
	res.json({ status: "ok", message: "SaferMzansi Node server running!" });
});

// Mount API Endpoints (Must be registered before the error handler)
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/otp", otpRouter);
app.use("/api/contacts", contactRouter);

// Global Error Handler Middleware (Must be at the very bottom, after routes)
app.use((err, req, res, next) => {
	const statusCode = err.status || 500;
	return res.status(statusCode).json({
		success: false,
		error: err.message || "An unexpected server error occurred.",
	});
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
