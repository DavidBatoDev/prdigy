const { supabase } = require('../lib/supabase');

/**
 * Middleware to verify Supabase JWT and attach user to request
 */
async function verifySupabaseJwt(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: { message: 'Missing or invalid authorization header' } });
    }

    const token = authHeader.substring(7);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: { message: 'Invalid or expired token' } });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    res.status(401).json({ error: { message: 'Authentication failed' } });
  }
}

/**
 * Middleware to require specific persona
 */
function requirePersona(...allowedPersonas) {
  return async (req, res, next) => {
    try {
      const { supabaseAdmin } = require('../lib/supabase');
      
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('active_persona')
        .eq('id', req.user.id)
        .single();

      if (error || !profile) {
        return res.status(403).json({ error: { message: 'Profile not found' } });
      }

      if (!allowedPersonas.includes(profile.active_persona)) {
        return res.status(403).json({ 
          error: { 
            message: `This action requires one of the following personas: ${allowedPersonas.join(', ')}` 
          } 
        });
      }

      req.userPersona = profile.active_persona;
      next();
    } catch (error) {
      console.error('Persona verification error:', error);
      res.status(500).json({ error: { message: 'Authorization check failed' } });
    }
  };
}

module.exports = {
  verifySupabaseJwt,
  requirePersona
};
