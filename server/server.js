// Load environment variables at the top
require("dotenv").config();

const cors = require("cors");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const RESPONSE_DEADLINE_MS = 3900;

// Middleware
app.use(cors());
app.use((req, res, next) => {
	// Emergency dispatch can wait for contact email delivery, so do not cut it off.
	if (req.method === "POST" && req.path === "/api/emergency/broadcast") {
		return next();
	}

	const deadline = setTimeout(() => {
		if (!res.headersSent) {
			res.status(504).json({
				success: false,
				error: "The request took too long. Please try again.",
			});
		}
	}, RESPONSE_DEADLINE_MS);
	res.once("finish", () => clearTimeout(deadline));
	res.once("close", () => clearTimeout(deadline));
	next();
});
app.use(express.json()); // Built-in Express JSON parser

// Import Routers
const authRouter = require("./src/routes/auth");
const contactRouter = require("./src/routes/contacts");
const emergencyRouter = require("./src/routes/emergency");
const evidenceRouter = require("./src/routes/evidence");
const incidentRouter = require("./src/routes/incident");
const incidentLocationRouter = require("./src/routes/incidentLocation");
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
app.use("/api/evidence", evidenceRouter);
app.use("/api/incidents", incidentRouter);
app.use("/api/emergency", emergencyRouter);
app.use("/api/locations", incidentLocationRouter);

// Global Error Handler Middleware (Must be at the very bottom, after routes)
app.use((err, req, res, next) => {
	if (res.headersSent) return next(err);
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
