-- Fix infinite recursion in profiles RLS policy introduced for marketplace visibility.
-- Root cause: policy queried public.profiles inside a profiles SELECT policy.

CREATE OR REPLACE FUNCTION public.is_verified_consultant(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = target_user_id
      AND p.is_consultant_verified = true
  );
$$;

DROP POLICY IF EXISTS "Verified consultants can view public freelancers"
ON public.profiles;

CREATE POLICY "Verified consultants can view public freelancers"
ON public.profiles
FOR SELECT
USING (
  is_public = true
  AND public.is_verified_consultant(auth.uid())
);
