# Supabase Multi-Tenant Database Setup Guide

This database setup provisions strict multi-tenant isolation, 5-tier role-based access control (RBAC), and automatic profile generation via PostgreSQL triggers.

## User Roles (Tiers)
- `super_admin`: Global platform administrator (Email: `rishiatwork25@gmail.com`, `corporate_id: null`). Operates above the tenant level.
- `app_admin`: Application telemetry and maintenance administrator.
- `corporate_admin`: Full management rights over their assigned Corporate Organization (tenant).
- `corporate_supervisor`: Stock management and inventory adjustment rights for their tenant.
- `corporate_user`: Read and standard inventory operation rights for their tenant.

---

## 1. Quick Setup via Supabase Web Dashboard
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and open your project.
2. Navigate to the **SQL Editor** in the left menu.
3. Open and run the migration file:
   `supabase/migrations/20261018000001_multi_tenant_schema_and_rls.sql`
4. Run the seed data script:
   `supabase/seed.sql`
5. Copy your **Project URL** and **Anon Public Key** from **Project Settings -> API** and add them to your `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   ```

---

## 2. Setup via Supabase CLI (Local Development)
If you are using the Supabase CLI locally:
```bash
# Start local Supabase containers (Docker required)
npx supabase start

# Apply migrations and seeds
npx supabase db reset
```

---

## 3. Claims Injection via app_metadata (Zero-DB Latency Middleware)
The database trigger in `supabase/migrations/20261018000002_sync_profile_to_app_metadata.sql` automatically syncs `role` and `corporate_id` from `public.user_profiles` into `auth.users.raw_app_meta_data`.
- Since Supabase embeds `raw_app_meta_data` into the signed user JWT, Next.js middleware and SSR components read `user_role` and `corporate_id` directly from the token.
- No database roundtrip is required during route gating, achieving sub-millisecond route interception without dashboard auth hooks.

---

## 4. Row Level Security (RLS) Verification
- All queries to `corporates`, `user_profiles`, `inventory_items`, and `inventory_transactions` enforce tenant boundaries via PostgreSQL Row Level Security.
- Cross-tenant data leakage is blocked at the database engine level. Even if a malicious corporate user attempts to read or mutate another tenant's UUID, PostgreSQL returns an empty set or rejects the transaction.
