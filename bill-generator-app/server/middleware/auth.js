const { createClient } = require('@supabase/supabase-js');

const supabase = require('../config/db');

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user || !user.id) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    req.user = user;
    req.userId = user.id;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

module.exports = auth;
