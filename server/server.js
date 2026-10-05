//Load environment variables at the top
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json()); // Built-in Express JSON parser

// Import Routers
const authRouter = require("./src/routes/auth");
const otpRouter = require("./src/routes/otpRoutes");
const contactRouter = require("./src/routes/contacts"); // <-- Added contact routes

// Mount API Endpoints
app.use("/api/users", authRouter);
app.use("/api/otp", otpRouter);
app.use("/api/contacts", contactRouter); // <-- Mounted at /api/contacts

// Health Check Endpoint
app.get("/api/health", (req, res) => {
	res.json({ status: "ok", message: "SaferMzansi Node server running!" });
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
	console.log(`Server running on http://localhost:${PORT}`);
});