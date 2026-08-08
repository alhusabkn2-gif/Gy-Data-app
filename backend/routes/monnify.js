*** Begin Patch
*** Update File: backend/routes/monnify.js
@@
-const monnifyController = require('../controllers/monnifyController');
+const monnifyController = require('../controllers/monnifyController');
+// Raw body middleware for webhook signature validation (route-level)
+const rawBody = require('../middlewares/rawBody');
@@
-router.post('/webhook', monnifyController.handleWebhook);
+// webhook route: capture raw body first, then controller
+router.post('/webhook', rawBody, monnifyController.handleWebhook);
*** End Patch
