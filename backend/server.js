require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const monnifyRouter = require('./routes/monnify');
const fundingRouter = require('./routes/funding');
const authRouter = require('./routes/auth');
const purchaseRouter = require('./routes/purchase');

const app = express();

app.use(cors());

/*
 * Capture raw body while parsing JSON.
 * Needed by Monnify webhook verification.
 */
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = Buffer.from(buf);
    },
  })
);

/*
 * API ROUTES
 * Keep these before the frontend fallback.
 */
app.use('/', monnifyRouter);
app.use('/api/funding', fundingRouter);
app.use('/api/auth', authRouter);
app.use('/api/purchase', purchaseRouter);

/*
 * Serve React/Vite frontend.
 * server.js is inside /backend
 * dist is in the project root.
 */
const frontendDist = path.join(__dirname, '..', 'dist');

app.use(express.static(frontendDist));

/*
 * React Router fallback.
 * This prevents Cannot GET /buy-data,
 * Cannot GET /wallet, etc.
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
