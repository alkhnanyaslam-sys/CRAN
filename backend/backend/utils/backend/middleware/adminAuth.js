// middleware/adminAuth.js
// Very lightweight admin protection: the owner logs in with a PIN
// (routes/auth.js), gets a token back, and must send it in the
// "x-admin-token" header on every protected request afterward.

const { readData } = require('../utils/db');

function adminAuth(req, res, next) {
  const token = req.header('x-admin-token');
  const settings = readData('settings') || {};

  if (!token || token !== settings.activeToken) {
    return res.status(401).json({ error: 'غير مصرح لك بالدخول — سجل دخول تاني.' });
  }
  next();
}

module.exports = adminAuth;
