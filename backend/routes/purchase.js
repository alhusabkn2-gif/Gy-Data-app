const express = require('express');
const router = express.Router();

const purchaseController = require('../controllers/purchaseController');

router.post('/', purchaseController.purchase);

module.exports = router;
