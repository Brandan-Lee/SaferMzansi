const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Sample Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SaferMzansi Node server running!' });
});

// Bind to 0.0.0.0 so physical devices on your Wi-Fi can connect
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});