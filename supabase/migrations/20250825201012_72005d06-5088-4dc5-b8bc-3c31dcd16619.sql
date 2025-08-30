-- Fix critical security vulnerability: Restrict access to admin user credentials

-- Drop the existing overly permissive policy that allows public access to admin credentials
DROP POLICY IF EXISTS "Admin can view admin users" ON public.admin_users;

-- Create restrictive RLS policies for admin_users table
-- Only authenticated admin users can view admin user data (protects credentials)
CREATE POLICY "Only admin can view admin users" 
  ON public.admin_users 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin_user());

-- Allow only authenticated admin users to update admin users
CREATE POLICY "Only admin can update admin users" 
  ON public.admin_users 
  FOR UPDATE 
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Allow only authenticated admin users to delete admin users
CREATE POLICY "Only admin can delete admin users" 
  ON public.admin_users 
  FOR DELETE 
  TO authenticated
  USING (public.is_admin_user());

-- Allow only authenticated admin users to insert new admin users
CREATE POLICY "Only admin can create admin users" 
  ON public.admin_users 
  FOR INSERT 
  TO authenticated
  WITH CHECK (public.is_admin_user());

-- Create a secure is_admin_user function that checks if the user is actually an admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $function$
  -- Check if the current user exists in the admin_users table
  -- This prevents unauthorized access to admin functions
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE username = auth.jwt() ->> 'email' 
    OR username = auth.jwt() ->> 'preferred_username'
  );
$function$;

-- Add comment explaining the security model
COMMENT ON TABLE public.admin_users IS 'Contains sensitive admin credentials - access restricted to authenticated admin users only. Password hashes and usernames are protected from public access.';