-- ==============================================================================
-- DATABASE SEED SCRIPT FOR MULTI-TENANT INVENTORY MANAGEMENT
-- Provisions initial Super Admin and demonstration tenants with strict isolation
-- ==============================================================================

-- 1. Insert Initial Corporates (Tenants)
INSERT INTO public.corporates (id, name, created_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Apex Global Logistics', NOW() - INTERVAL '30 days'),
    ('22222222-2222-2222-2222-222222222222', 'Summit Industrial Supplies', NOW() - INTERVAL '14 days')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Provision Supabase Auth Users and Linked Profiles
-- If running directly in Supabase SQL editor:
-- Note: In production Supabase, users are created via auth.signUp or Supabase Admin API.
-- This script safely upserts into auth.users (if privileges allow) and public.user_profiles.

DO $$
DECLARE
    super_admin_id UUID := '00000000-0000-0000-0000-000000000001';
    app_admin_id   UUID := '00000000-0000-0000-0000-000000000002';
    corp_admin_1   UUID := '00000000-0000-0000-0000-000000000003';
    corp_sup_1     UUID := '00000000-0000-0000-0000-000000000004';
    corp_user_1    UUID := '00000000-0000-0000-0000-000000000005';
    corp_admin_2   UUID := '00000000-0000-0000-0000-000000000006';
    corp_user_2    UUID := '00000000-0000-0000-0000-000000000007';
    -- Encrypted password hash for standard 'Password123!'
    encrypted_pw TEXT := crypt('Password123!', gen_salt('bf'));
BEGIN
    -- Check if auth schema is accessible
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        
        -- A. Super Admin: rishiatwork25@gmail.com
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            role, aud
        ) VALUES (
            super_admin_id,
            '00000000-0000-0000-0000-000000000000',
            'rishiatwork25@gmail.com',
            encrypted_pw,
            NOW(),
            '{"provider":"email","providers":["email"],"user_role":"super_admin","corporate_id":null}',
            '{"role":"super_admin","full_name":"Rishi Super Admin"}',
            NOW(), NOW(), 'authenticated', 'authenticated'
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            raw_app_meta_data = EXCLUDED.raw_app_meta_data,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data;

        -- B. App Admin
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            role, aud
        ) VALUES (
            app_admin_id,
            '00000000-0000-0000-0000-000000000000',
            'appadmin@stockmanagement.io',
            encrypted_pw,
            NOW(),
            '{"provider":"email","providers":["email"],"user_role":"app_admin","corporate_id":null}',
            '{"role":"app_admin","full_name":"Operations Admin"}',
            NOW(), NOW(), 'authenticated', 'authenticated'
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            raw_app_meta_data = EXCLUDED.raw_app_meta_data;

        -- C. Apex Logistics Corporate Admin
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            role, aud
        ) VALUES (
            corp_admin_1,
            '00000000-0000-0000-0000-000000000000',
            'apex.admin@apexlogistics.com',
            encrypted_pw,
            NOW(),
            '{"provider":"email","providers":["email"],"user_role":"corporate_admin","corporate_id":"11111111-1111-1111-1111-111111111111"}',
            '{"role":"corporate_admin","corporate_id":"11111111-1111-1111-1111-111111111111","full_name":"Apex Admin"}',
            NOW(), NOW(), 'authenticated', 'authenticated'
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            raw_app_meta_data = EXCLUDED.raw_app_meta_data;

        -- D. Apex Logistics Corporate Supervisor
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            role, aud
        ) VALUES (
            corp_sup_1,
            '00000000-0000-0000-0000-000000000000',
            'apex.supervisor@apexlogistics.com',
            encrypted_pw,
            NOW(),
            '{"provider":"email","providers":["email"],"user_role":"corporate_supervisor","corporate_id":"11111111-1111-1111-1111-111111111111"}',
            '{"role":"corporate_supervisor","corporate_id":"11111111-1111-1111-1111-111111111111","full_name":"Apex Supervisor"}',
            NOW(), NOW(), 'authenticated', 'authenticated'
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            raw_app_meta_data = EXCLUDED.raw_app_meta_data;

        -- E. Apex Logistics Corporate User
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            role, aud
        ) VALUES (
            corp_user_1,
            '00000000-0000-0000-0000-000000000000',
            'apex.user@apexlogistics.com',
            encrypted_pw,
            NOW(),
            '{"provider":"email","providers":["email"],"user_role":"corporate_user","corporate_id":"11111111-1111-1111-1111-111111111111"}',
            '{"role":"corporate_user","corporate_id":"11111111-1111-1111-1111-111111111111","full_name":"Apex User"}',
            NOW(), NOW(), 'authenticated', 'authenticated'
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            raw_app_meta_data = EXCLUDED.raw_app_meta_data;

        -- F. Summit Industrial Corporate Admin (Tenant 2)
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            role, aud
        ) VALUES (
            corp_admin_2,
            '00000000-0000-0000-0000-000000000000',
            'summit.admin@summitind.com',
            encrypted_pw,
            NOW(),
            '{"provider":"email","providers":["email"],"user_role":"corporate_admin","corporate_id":"22222222-2222-2222-2222-222222222222"}',
            '{"role":"corporate_admin","corporate_id":"22222222-2222-2222-2222-222222222222","full_name":"Summit Admin"}',
            NOW(), NOW(), 'authenticated', 'authenticated'
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            raw_app_meta_data = EXCLUDED.raw_app_meta_data;

        -- G. Summit Industrial Corporate User (Tenant 2)
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            role, aud
        ) VALUES (
            corp_user_2,
            '00000000-0000-0000-0000-000000000000',
            'summit.user@summitind.com',
            encrypted_pw,
            NOW(),
            '{"provider":"email","providers":["email"],"user_role":"corporate_user","corporate_id":"22222222-2222-2222-2222-222222222222"}',
            '{"role":"corporate_user","corporate_id":"22222222-2222-2222-2222-222222222222","full_name":"Summit User"}',
            NOW(), NOW(), 'authenticated', 'authenticated'
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            raw_app_meta_data = EXCLUDED.raw_app_meta_data;

    END IF;

    -- Directly ensure public.user_profiles records are accurate
    INSERT INTO public.user_profiles (id, email, role, corporate_id, updated_at)
    VALUES
        (super_admin_id, 'rishiatwork25@gmail.com', 'super_admin', NULL, NOW()),
        (app_admin_id, 'appadmin@stockmanagement.io', 'app_admin', NULL, NOW()),
        (corp_admin_1, 'apex.admin@apexlogistics.com', 'corporate_admin', '11111111-1111-1111-1111-111111111111', NOW()),
        (corp_sup_1, 'apex.supervisor@apexlogistics.com', 'corporate_supervisor', '11111111-1111-1111-1111-111111111111', NOW()),
        (corp_user_1, 'apex.user@apexlogistics.com', 'corporate_user', '11111111-1111-1111-1111-111111111111', NOW()),
        (corp_admin_2, 'summit.admin@summitind.com', 'corporate_admin', '22222222-2222-2222-2222-222222222222', NOW()),
        (corp_user_2, 'summit.user@summitind.com', 'corporate_user', '22222222-2222-2222-2222-222222222222', NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        corporate_id = EXCLUDED.corporate_id,
        updated_at = NOW();

END $$;

-- 3. Seed Inventory Items for Apex Global Logistics (Tenant 1)
INSERT INTO public.inventory_items (id, corporate_id, sku, name, category, quantity, unit_price, min_threshold)
VALUES
    ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'APX-PAL-01', 'Heavy Duty Euro Pallets', 'Warehousing', 1420, 24.50, 200),
    ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'APX-STR-50', 'Industrial Stretch Film 500mm', 'Packaging', 380, 18.75, 50),
    ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'APX-BAR-99', 'Wireless RFID Handheld Scanner', 'Electronics', 42, 389.00, 10),
    ('a0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'APX-BOX-XL', 'Reinforced Corrugated Box XL', 'Packaging', 4, 3.20, 100) -- low stock trigger!
ON CONFLICT (corporate_id, sku) DO NOTHING;

-- 4. Seed Inventory Items for Summit Industrial Supplies (Tenant 2)
INSERT INTO public.inventory_items (id, corporate_id, sku, name, category, quantity, unit_price, min_threshold)
VALUES
    ('b0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'SMT-VAL-12', 'High-Pressure Ball Valve 2"', 'Hydraulics', 85, 145.00, 20),
    ('b0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'SMT-PIP-316', '316L Stainless Steel Flange 4"', 'Piping', 210, 89.50, 40),
    ('b0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'SMT-GAS-NPT', 'High-Temp Spiral Wound Gasket', 'Seals', 640, 12.20, 100)
ON CONFLICT (corporate_id, sku) DO NOTHING;

-- 5. Seed Recent Transactions
INSERT INTO public.inventory_transactions (corporate_id, item_id, type, quantity, notes, created_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'IN', 250, 'Quarterly pallet restock', NOW() - INTERVAL '2 days'),
    ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', 'OUT', 40, 'Outbound freight wrapping', NOW() - INTERVAL '1 day'),
    ('22222222-2222-2222-2222-222222222222', 'b0000000-0000-0000-0000-000000000001', 'IN', 30, 'Supplier shipment batch 89A', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;
