require('dotenv').config();
const express = require('express');
const cors = require('cors');
const monnifyRouter = require('./routes/monnify');

const app = express();

// Enable CORS
app.use(cors());

// Enable JSON parsing for normal API routes
app.use(express.json());

// Mount Monnify router
app.use('/', monnifyRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
