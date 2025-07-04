require('dotenv').config();

function isAdmin(req, res, next) {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const base64 = authorization.split(' ')[1];
  const [user, pass] = Buffer.from(base64, 'base64').toString().split(':');
  if (
    user === process.env.ADMIN_USERNAME &&
    pass === process.env.ADMIN_PASSWORD
  ) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { isAdmin };
