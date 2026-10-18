-- ==============================================================================
-- PHARMAHUB MULTI-TENANT INVENTORY PLATFORM
-- CONSOLIDATED DATABASE SCHEMA, RLS POLICIES & AUTOMATED TRIGGERS
-- Execute directly in the Supabase Dashboard SQL Editor (PostgreSQL 15+)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. User Roles Enum (5 Granular Tiers)
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'super_admin',            -- Global platform control across all tenant OUs
        'app_admin',              -- Platform telemetry, operations, and audit logs
        'corporate_admin',        -- Full administration of dedicated corporate OU
        'corporate_supervisor',   -- Catalog adjustments, stock threshold alerts
        'corporate_user'          -- Inventory reading and standard movements
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. Corporates Table (Primary Tenant Organizational Units)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.corporates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_corporates_name ON public.corporates(name);

-- ------------------------------------------------------------------------------
-- 3. User Profiles Table (Linked to Supabase auth.users)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 4. Multi-Tenant Inventory Items Table
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 5. Multi-Tenant Inventory Transactions Table
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 6. Helper Security Definer Functions (Avoid Infinite RLS Recursion)
-- ------------------------------------------------------------------------------

-- Get authenticated caller's role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Get authenticated caller's corporate tenant ID
CREATE OR REPLACE FUNCTION public.get_auth_corporate_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT corporate_id FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Check if caller is super_admin or app_admin
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

-- ------------------------------------------------------------------------------
-- 7. Enable Row Level Security (RLS) on All Tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.corporates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 8. Row Level Security Policies
-- ------------------------------------------------------------------------------

-- === Corporates Policies ===
DROP POLICY IF EXISTS "corporates_select_policy" ON public.corporates;
CREATE POLICY "corporates_select_policy" ON public.corporates
FOR SELECT USING (
    public.is_super_or_app_admin()
    OR id = public.get_auth_corporate_id()
);

DROP POLICY IF EXISTS "corporates_insert_policy" ON public.corporates;
CREATE POLICY "corporates_insert_policy" ON public.corporates
FOR INSERT WITH CHECK (
    public.get_auth_role() IN ('super_admin', 'app_admin')
);

DROP POLICY IF EXISTS "corporates_update_policy" ON public.corporates;
CREATE POLICY "corporates_update_policy" ON public.corporates
FOR UPDATE USING (
    public.get_auth_role() IN ('super_admin', 'app_admin')
    OR (id = public.get_auth_corporate_id() AND public.get_auth_role() = 'corporate_admin')
);

DROP POLICY IF EXISTS "corporates_delete_policy" ON public.corporates;
CREATE POLICY "corporates_delete_policy" ON public.corporates
FOR DELETE USING (
    public.get_auth_role() = 'super_admin'
);

-- === User Profiles Policies ===
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
FOR SELECT USING (
    public.is_super_or_app_admin()
    OR id = auth.uid()
    OR (corporate_id IS NOT NULL AND corporate_id = public.get_auth_corporate_id())
);

DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
FOR INSERT WITH CHECK (
    public.get_auth_role() IN ('super_admin', 'app_admin')
    OR (public.get_auth_role() = 'corporate_admin' AND corporate_id = public.get_auth_corporate_id())
    OR id = auth.uid()
);

DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
FOR UPDATE USING (
    public.get_auth_role() IN ('super_admin', 'app_admin')
    OR id = auth.uid()
    OR (public.get_auth_role() = 'corporate_admin' AND corporate_id = public.get_auth_corporate_id())
);

DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;
CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles
FOR DELETE USING (
    public.get_auth_role() = 'super_admin'
    OR (public.get_auth_role() = 'corporate_admin' AND corporate_id = public.get_auth_corporate_id() AND id <> auth.uid())
);

-- === Inventory Items Policies (Strict Corporate Isolation) ===
DROP POLICY IF EXISTS "inventory_items_select_policy" ON public.inventory_items;
CREATE POLICY "inventory_items_select_policy" ON public.inventory_items
FOR SELECT USING (
    public.is_super_or_app_admin()
    OR (
        corporate_id = public.get_auth_corporate_id()
        AND public.get_auth_role() IN ('corporate_admin', 'corporate_supervisor', 'corporate_user')
    )
);

DROP POLICY IF EXISTS "inventory_items_insert_policy" ON public.inventory_items;
CREATE POLICY "inventory_items_insert_policy" ON public.inventory_items
FOR INSERT WITH CHECK (
    public.get_auth_role() IN ('super_admin', 'app_admin')
    OR (
        corporate_id = public.get_auth_corporate_id()
        AND public.get_auth_role() IN ('corporate_admin', 'corporate_supervisor')
    )
);

DROP POLICY IF EXISTS "inventory_items_update_policy" ON public.inventory_items;
CREATE POLICY "inventory_items_update_policy" ON public.inventory_items
FOR UPDATE USING (
    public.is_super_or_app_admin()
    OR (
        corporate_id = public.get_auth_corporate_id()
        AND public.get_auth_role() IN ('corporate_admin', 'corporate_supervisor', 'corporate_user')
    )
)
WITH CHECK (
    public.is_super_or_app_admin()
    OR (corporate_id = public.get_auth_corporate_id())
);

DROP POLICY IF EXISTS "inventory_items_delete_policy" ON public.inventory_items;
CREATE POLICY "inventory_items_delete_policy" ON public.inventory_items
FOR DELETE USING (
    public.get_auth_role() = 'super_admin'
    OR (corporate_id = public.get_auth_corporate_id() AND public.get_auth_role() = 'corporate_admin')
);

-- === Inventory Transactions Policies ===
DROP POLICY IF EXISTS "transactions_select_policy" ON public.inventory_transactions;
CREATE POLICY "transactions_select_policy" ON public.inventory_transactions
FOR SELECT USING (
    public.is_super_or_app_admin()
    OR (
        corporate_id = public.get_auth_corporate_id()
        AND public.get_auth_role() IN ('corporate_admin', 'corporate_supervisor', 'corporate_user')
    )
);

DROP POLICY IF EXISTS "transactions_insert_policy" ON public.inventory_transactions;
CREATE POLICY "transactions_insert_policy" ON public.inventory_transactions
FOR INSERT WITH CHECK (
    public.get_auth_role() IN ('super_admin', 'app_admin')
    OR (
        corporate_id = public.get_auth_corporate_id()
        AND public.get_auth_role() IN ('corporate_admin', 'corporate_supervisor', 'corporate_user')
    )
);

-- ------------------------------------------------------------------------------
-- 9. Trigger 1: Auto-Provision Profile on auth.users Creation (Super Admin Pre-Bound)
-- ------------------------------------------------------------------------------
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
    -- Auto-assign root super_admin role to provisioned owner
    IF NEW.email = 'rishiatwork25@gmail.com' THEN
        v_role := 'super_admin';
        v_corporate_id := NULL;
    ELSE
        -- Parse role from user metadata if provided
        IF NEW.raw_user_meta_data ? 'role' AND (NEW.raw_user_meta_data->>'role') IS NOT NULL THEN
            BEGIN
                v_role := (NEW.raw_user_meta_data->>'role')::user_role;
            EXCEPTION WHEN OTHERS THEN
                v_role := 'corporate_user';
            END;
        END IF;

        -- Parse corporate_id from metadata if provided
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

-- ------------------------------------------------------------------------------
-- 10. Trigger 2: Sync Profile Claims to auth.users raw_app_meta_data (Zero-DB JWT)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_to_app_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sync user_role and corporate_id directly into auth.users raw_app_meta_data
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

-- ------------------------------------------------------------------------------
-- 11. Schema Grants
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;
