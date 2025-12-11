const express = require('express');
const router = express.Router();
const { verifySupabaseJwt, requirePersona } = require('../middleware/auth');
const { supabaseAdmin } = require('../lib/supabase');

/**
 * GET /api/admin/consultants/pending
 * Get pending consultant verification requests
 */
router.get('/consultants/pending', verifySupabaseJwt, requirePersona('admin'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('is_consultant_verified', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/consultants/:id/verify
 * Verify a consultant
 */
router.post('/consultants/:id/verify', verifySupabaseJwt, requirePersona('admin'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_consultant_verified: true })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/projects
 * Get all projects (Admin only)
 */
router.get('/projects', verifySupabaseJwt, requirePersona('admin'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        client:profiles!projects_client_id_fkey (
          id,
          display_name,
          email
        ),
        consultant:profiles!projects_consultant_id_fkey (
          id,
          display_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users
 * Get all users (Admin only)
 */
router.get('/users', verifySupabaseJwt, requirePersona('admin'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
