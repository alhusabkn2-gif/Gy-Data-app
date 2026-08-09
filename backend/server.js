require('dotenv').config();
const express = require('express');
const cors = require('cors');

const monnifyRouter = require('./routes/monnify');
const fundingRouter = require('./routes/funding');

const app = express();

app.use(cors());

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = Buffer.from(buf);
    }
  })
);

app.get('/', (req, res) => {
  res.json({
    status: 'Backend is running'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok'
  });
});

app.use('/', monnifyRouter);
app.use('/api/funding', fundingRouter);

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
