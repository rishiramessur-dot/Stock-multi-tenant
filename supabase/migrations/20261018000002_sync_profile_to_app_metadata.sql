-- ==============================================================================
-- CLAIMS INJECTION VIA app_metadata (INFRASTRUCTURE-AS-CODE OPTIMIZATION)
-- Syncs role and corporate_id from user_profiles to auth.users.raw_app_meta_data
-- so Next.js frontend and middleware can read claims directly from JWT without DB calls.
-- ==============================================================================

-- 1. Create a function to sync profile data to auth.users
CREATE OR REPLACE FUNCTION public.sync_profile_to_app_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the auth.users table with the role and corporate_id in raw_app_meta_data
  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'user_role', NEW.role, 
      'corporate_id', NEW.corporate_id
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- 2. Attach the trigger to your user_profiles table
DROP TRIGGER IF EXISTS on_profile_update_sync_metadata ON public.user_profiles;

CREATE TRIGGER on_profile_update_sync_metadata
  AFTER INSERT OR UPDATE OF role, corporate_id ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_app_metadata();
