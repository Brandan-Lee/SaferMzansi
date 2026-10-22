const cors = require("cors");
const express = require("express");

const errorHandler = require("#middleware/errorHandler.js");
const notFoundHandler = require("#middleware/notFoundHandler.js");
const requestDeadline = require("#middleware/requestDeadline.js");
const authRouter = require("#routes/auth.js");
const contactRouter = require("#routes/contacts.js");
const emergencyRouter = require("#routes/emergency.js");
const evidenceRouter = require("#routes/evidence.js");
const incidentRouter = require("#routes/incident.js");
const incidentLocationRouter = require("#routes/incidentLocation.js");
const otpRouter = require("#routes/otpRoutes.js");
const userRouter = require("#routes/users.js");

const app = express();

app.use(cors());
app.use(requestDeadline);
app.use(express.json());

app.get("/api/health", (req, res) => {
	res.json({ status: "ok", message: "SaferMzansi Node server running!" });
});

// Register API routes before the error handler so route failures reach it.
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/otp", otpRouter);
app.use("/api/contacts", contactRouter);
app.use("/api/evidence", evidenceRouter);
app.use("/api/incidents", incidentRouter);
app.use("/api/emergency", emergencyRouter);
app.use("/api/locations", incidentLocationRouter);

// Express only recognizes an error handler when it is registered last.
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
