require('dotenv').config();
const express = require('express');
const cors = require('cors');
const monnifyRouter = require('./routes/monnify');

const app = express();

// Enable CORS
app.use(cors());

// Capture raw request body for webhook verification while still populating req.body
app.use(
  express.json({
    verify: (req, res, buf) => {
      // Store the raw bytes exactly as received on req.rawBody for webhook signature verification
      if (buf && buf.length) {
        req.rawBody = Buffer.from(buf);
      } else {
        req.rawBody = Buffer.from('');
      }
    }
  })
);

// Mount Monnify router
app.use('/', monnifyRouter);

// Root endpoint to confirm backend is running
app.get('/', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
