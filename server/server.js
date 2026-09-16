const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// Sample Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SaferMzansi Node server running!' });
});

// Bind to 0.0.0.0 so physical devices on your Wi-Fi can connect
app.listen(PORT, function() {
  console.log(`Server running on http://localhost:${PORT}`);
});