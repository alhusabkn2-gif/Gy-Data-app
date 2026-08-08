// Simple route-level raw-body capture middleware for webhooks.
// Usage: apply it only to the webhook route before any body-parser executes.
module.exports = function rawBodyMiddleware(req, res, next) {
  try {
    const contentType = (req.headers['content-type'] || '').toString().toLowerCase();
    // Only collect raw body for JSON-like webhook content types
    if (contentType.includes('application/json') || contentType.includes('application/*+json')) {
      const chunks = [];
      // If some middleware has already set rawBody, skip
      if (req.rawBody && Buffer.isBuffer(req.rawBody)) return next();
      req.on('data', chunk => {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      req.on('end', () => {
        try {
          req.rawBody = Buffer.concat(chunks);
        } catch (e) {
          req.rawBody = Buffer.from('');
        }
        return next();
      });
      req.on('error', err => next(err));
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
};
