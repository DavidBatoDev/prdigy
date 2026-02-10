const { supabase, supabaseAdmin } = require('../lib/supabase');

/**
 * Middleware to verify Supabase JWT or guest user and attach user to request
 * Supports both authenticated users (with JWT) and guest users (with guest_user_id header)
 */
async function verifySupabaseJwt(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const guestUserId = req.headers['x-guest-user-id'];
    
    // Try JWT authentication first (for authenticated users)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Skip if token is literally 'null' or 'undefined'
      if (token !== 'null' && token !== 'undefined') {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!error && user) {
          // Attach authenticated user to request
          req.user = user;
          return next();
        }
      }
    }
    
    // Try guest authentication (for guest users)
    if (guestUserId) {
      // Verify guest user exists and is valid
      const { data: guestProfile, error } = await supabaseAdmin
        .from('profiles')
        .select('id, is_guest, guest_session_id, created_at')
        .eq('id', guestUserId)
        .eq('is_guest', true)
        .single();
      
      if (error || !guestProfile) {
        return res.status(401).json({ error: { message: 'Invalid guest user' } });
      }
      
      // Check if guest session is expired (30 days)
      const createdAt = new Date(guestProfile.created_at);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      if (createdAt < thirtyDaysAgo) {
        return res.status(401).json({ error: { message: 'Guest session expired' } });
      }
      
      // Attach guest user to request (format matches Supabase user object)
      req.user = {
        id: guestProfile.id,
        is_guest: true,
        guest_session_id: guestProfile.guest_session_id,
      };
      return next();
    }
    
    // No valid authentication found
    return res.status(401).json({ error: { message: 'Missing or invalid authorization' } });
  } catch (error) {
    console.error('Authentication error:', error);
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
