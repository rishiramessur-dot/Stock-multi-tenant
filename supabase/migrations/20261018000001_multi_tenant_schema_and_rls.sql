-- ==============================================================================
-- MULTI-TENANT INVENTORY MANAGEMENT SCHEMA & STRICT TENANT ISOLATION (RLS)
-- ==============================================================================

-- 1. Create User Roles Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'super_admin',
        'app_admin',
        'corporate_admin',
        'corporate_supervisor',
        'corporate_user'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Corporates Table (Primary Tenant Identifier)
CREATE TABLE IF NOT EXISTS public.corporates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for corporate queries
CREATE INDEX IF NOT EXISTS idx_corporates_name ON public.corporates(name);

-- 3. Create User Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'corporate_user',
    corporate_id UUID REFERENCES public.corporates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_corporate_id ON public.user_profiles(corporate_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- 4. Multi-Tenant Inventory Tables
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_id UUID NOT NULL REFERENCES public.corporates(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    min_threshold INTEGER NOT NULL DEFAULT 5 CHECK (min_threshold >= 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_corporate_sku UNIQUE (corporate_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_corporate_id ON public.inventory_items(corporate_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_id UUID NOT NULL REFERENCES public.corporates(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL,
    notes TEXT,
    performed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_corporate_id ON public.inventory_transactions(corporate_id);
CREATE INDEX IF NOT EXISTS idx_transactions_item_id ON public.inventory_transactions(item_id);

-- ==============================================================================
-- 5. Helper Functions for Safe, Performant RLS (Avoid Infinite Recursion)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_corporate_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT corporate_id FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_super_or_app_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT role IN ('super_admin', 'app_admin') FROM public.user_profiles WHERE id = auth.uid()),
        false
    );
$$;

-- ==============================================================================
-- 6. Strict Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.corporates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. Corporates Table Policies
-- ------------------------------------------------------------------------------

-- SELECT: Super admins and app admins can view all corporates.
-- Corporate users can ONLY view their own corporate record.
CREATE POLICY "corporates_select_policy"
ON public.corporates
FOR SELECT
USING (
    public.is_super_or_app_admin()
    OR id = public.get_auth_corporate_id()
);

-- INSERT: Only super_admin or app_admin can create new corporate tenants
CREATE POLICY "corporates_insert_policy"
ON public.corporates
FOR INSERT
WITH CHECK (
    public.get_auth_role() IN ('super_admin', 'app_admin')
);

-- UPDATE: Super admins can update any; corporate_admins can update their own corporate name
CREATE POLICY "corporates_update_policy"
ON public.corporates
FOR UPDATE
USING (
    public.get_auth_role() IN ('super_admin', 'app_admin')
    OR (
        id = public.get_auth_corporate_id()
        AND public.get_auth_role() = 'corporate_admin'
    )
);

-- DELETE: Only super_admin can delete a corporate tenant
CREATE POLICY "corporates_delete_policy"
ON public.corporates
FOR DELETE
USING (
    public.get_auth_role() = 'super_admin'
);

-- ------------------------------------------------------------------------------
-- B. User Profiles Table Policies
-- ------------------------------------------------------------------------------

-- SELECT: Super/App Admin sees all. Users can see their own profile or profiles in their corporate.
CREATE POLICY "user_profiles_select_policy"
ON public.user_profiles
FOR SELECT
USING (
    public.is_super_or_app_admin()
    OR id = auth.uid()
    OR (
        corporate_id IS NOT NULL 
        AND corporate_id = public.get_auth_corporate_id()
    )
);

-- INSERT: Handled by system trigger or super_admin / corporate_admin for their tenant
CREATE POLICY "user_profiles_insert_policy"
ON public.user_profiles
FOR INSERT
WITH CHECK (
    public.get_auth_role() IN ('super_admin', 'app_admin')
    OR (
        public.get_auth_role() = 'corporate_admin'
        AND corporate_id = public.get_auth_corporate_id()
    )
    OR id = auth.uid()
);

-- UPDATE: Super admins can update any; corporate_admins can update users in their corporate. Users can update own profile.
CREATE POLICY "user_profiles_update_policy"
ON public.user_profiles
FOR UPDATE
USING (
    public.is_super_or_app_admin()
    OR id = auth.uid()
    OR (
        public.get_auth_role() = 'corporate_admin'
        AND corporate_id = public.get_auth_corporate_id()
    )
);

-- DELETE: Super admins can delete any; corporate_admins can delete non-admin members in their corporate
CREATE POLICY "user_profiles_delete_policy"
ON public.user_profiles
FOR DELETE
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'corporate_admin'
        AND corporate_id = public.get_auth_corporate_id()
        AND id <> auth.uid()
    )
);

-- ------------------------------------------------------------------------------
-- C. Inventory Items Table Policies (Absolute Tenant Isolation)
-- ------------------------------------------------------------------------------

-- SELECT: Super Admins can see all. Corporate tiers can ONLY select rows matching their corporate_id.
CREATE POLICY "inventory_items_select_policy"
ON public.inventory_items
FOR SELECT
USING (
    public.is_super_or_app_admin()
    OR (
        corporate_id = public.get_auth_corporate_id()
        AND public.get_auth_role() IN ('corporate_admin', 'corporate_supervisor', 'corporate_user')
    )
);

-- INSERT: Super Admins can insert; corporate tiers can only insert rows where corporate_id matches their corporate_id.
CREATE POLICY "inventory_items_insert_policy"
ON public.inventory_items
FOR INSERT
WITH CHECK (
    public.get_auth_role() IN ('super_admin', 'app_admin')
    OR (
        corporate_id = public.get_auth_corporate_id()
        AND public.get_auth_role() IN ('corporate_admin', 'corporate_supervisor')
    )
);

-- UPDATE: Strict tenant isolation matching corporate_id
CREATE POLICY "inventory_items_update_policy"
ON public.inventory_items
FOR UPDATE
USING (
    public.is_super_or_app_admin()
    OR (
        corporate_id = public.get_auth_corporate_id()
        AND public.get_auth_role() IN ('corporate_admin', 'corporate_supervisor', 'corporate_user')
    )
)
WITH CHECK (
    public.is_super_or_app_admin()
    OR (
        corporate_id = public.get_auth_corporate_id()
    )
);

-- DELETE: Only super_admin or corporate_admin for their tenant
CREATE POLICY "inventory_items_delete_policy"
ON public.inventory_items
FOR DELETE
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        corporate_id = public.get_auth_corporate_id()
        AND public.get_auth_role() = 'corporate_admin'
    )
);

-- ------------------------------------------------------------------------------
-- D. Inventory Transactions Policies (Absolute Tenant Isolation)
-- ------------------------------------------------------------------------------

CREATE POLICY "transactions_select_policy"
ON public.inventory_transactions
FOR SELECT
USING (
    public.is_super_or_app_admin()
    OR (
        corporate_id = public.get_auth_corporate_id()
        AND public.get_auth_role() IN ('corporate_admin', 'corporate_supervisor', 'corporate_user')
    )
);

CREATE POLICY "transactions_insert_policy"
ON public.inventory_transactions
FOR INSERT
WITH CHECK (
    public.get_auth_role() IN ('super_admin', 'app_admin')
    OR (
        corporate_id = public.get_auth_corporate_id()
        AND public.get_auth_role() IN ('corporate_admin', 'corporate_supervisor', 'corporate_user')
    )
);

-- ==============================================================================
-- 7. Supabase Auth Trigger (Automated Profile Creation & Super Admin Provisioning)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role user_role := 'corporate_user';
    v_corporate_id UUID := NULL;
BEGIN
    -- Explicitly verify if user is the provisioned Super Admin
    IF NEW.email = 'rishiatwork25@gmail.com' THEN
        v_role := 'super_admin';
        v_corporate_id := NULL;
    ELSE
        -- Check metadata if provided at creation
        IF NEW.raw_user_meta_data ? 'role' AND (NEW.raw_user_meta_data->>'role') IS NOT NULL THEN
            BEGIN
                v_role := (NEW.raw_user_meta_data->>'role')::user_role;
            EXCEPTION WHEN OTHERS THEN
                v_role := 'corporate_user';
            END;
        END IF;

        IF NEW.raw_user_meta_data ? 'corporate_id' AND (NEW.raw_user_meta_data->>'corporate_id') IS NOT NULL THEN
            BEGIN
                v_corporate_id := (NEW.raw_user_meta_data->>'corporate_id')::UUID;
            EXCEPTION WHEN OTHERS THEN
                v_corporate_id := NULL;
            END;
        END IF;
    END IF;

    -- Upsert profile record
    INSERT INTO public.user_profiles (id, email, role, corporate_id, updated_at)
    VALUES (NEW.id, NEW.email, v_role, v_corporate_id, timezone('utc'::text, now()))
    ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            role = CASE 
                WHEN EXCLUDED.email = 'rishiatwork25@gmail.com' THEN 'super_admin'::user_role 
                ELSE EXCLUDED.role 
            END,
            corporate_id = CASE 
                WHEN EXCLUDED.email = 'rishiatwork25@gmail.com' THEN NULL 
                ELSE EXCLUDED.corporate_id 
            END,
            updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. Claims Injection via app_metadata (Infrastructure-As-Code Optimization)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sync_profile_to_app_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update auth.users raw_app_meta_data with user_role and corporate_id
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

DROP TRIGGER IF EXISTS on_profile_update_sync_metadata ON public.user_profiles;

CREATE TRIGGER on_profile_update_sync_metadata
  AFTER INSERT OR UPDATE OF role, corporate_id ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_app_metadata();
