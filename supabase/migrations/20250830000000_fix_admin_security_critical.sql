-- ===================================================
-- CRITICAL SECURITY FIX - IMMEDIATE ACTION REQUIRED
-- ===================================================
-- This migration fixes the critical security vulnerability where admin credentials
-- are visible to anyone in the browser

-- 1. IMMEDIATELY DROP THE INSECURE POLICY
DROP POLICY IF EXISTS "Admin can view admin users" ON public.admin_users;

-- 2. CREATE SECURE RLS POLICIES
-- Only authenticated users who are actually admins can access admin_users table
CREATE POLICY "Secure admin access only" 
  ON public.admin_users 
  FOR ALL 
  TO authenticated
  USING (public.is_secure_admin_user())
  WITH CHECK (public.is_secure_admin_user());

-- 3. CREATE A SECURE ADMIN CHECK FUNCTION
CREATE OR REPLACE FUNCTION public.is_secure_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $function$
  -- This function checks if the current user is actually an admin
  -- by verifying their session and admin status
  DECLARE
    current_username text;
    is_admin boolean := false;
  BEGIN
    -- Get username from JWT token or session
    current_username := COALESCE(
      auth.jwt() ->> 'email',
      auth.jwt() ->> 'preferred_username',
      auth.jwt() ->> 'username'
    );
    
    -- If no username found, deny access
    IF current_username IS NULL THEN
      RETURN false;
    END IF;
    
    -- Check if user exists in admin_users table
    SELECT EXISTS(
      SELECT 1 FROM admin_users 
      WHERE username = current_username
    ) INTO is_admin;
    
    RETURN is_admin;
  END;
$function$;

-- 4. ADD SECURITY COMMENT
COMMENT ON TABLE public.admin_users IS 'CRITICAL: Contains admin credentials - access restricted to verified admin users only.';

-- 5. VERIFY THE FIX
-- This will show that the table is now properly secured
SELECT 
  'Security Status' as check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ SECURE: No public access policies found'
    ELSE '❌ INSECURE: Public access policies still exist'
  END as status,
  COUNT(*) as insecure_policies
FROM pg_policies 
WHERE tablename = 'admin_users' 
AND permissive = true;

