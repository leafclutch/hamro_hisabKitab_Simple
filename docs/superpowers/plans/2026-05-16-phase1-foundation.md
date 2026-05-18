# Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundation of Hamro HisabKitab — a Next.js 15 app with Supabase auth, role-based permissions, full user CRUD, and the core dashboard layout.

**Architecture:** Next.js 15 App Router (TypeScript + Tailwind CSS). Supabase handles authentication (SSR-compatible via `@supabase/ssr`) and PostgreSQL. Route protection via Next.js middleware. User creation uses the Supabase Admin API (service_role key) exclusively server-side. All auth mutations are Server Actions.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Supabase Auth + PostgreSQL + RLS, @supabase/ssr, lucide-react, clsx, tailwind-merge

---

## File Structure

```
/home/sid/leafclutch/hamro_hisabKitab_Simple/
├── .env.local                                      # secrets (gitignored)
├── .env.example                                    # template (committed)
├── src/
│   ├── app/
│   │   ├── layout.tsx                              # root layout + providers
│   │   ├── globals.css                             # global styles + CSS vars
│   │   ├── favicon.ico                             # app favicon
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                          # centered auth layout
│   │   │   ├── login/page.tsx                      # login page
│   │   │   └── forgot-password/page.tsx            # forgot password page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                          # sidebar + navbar layout
│   │   │   ├── page.tsx                            # dashboard home
│   │   │   └── settings/
│   │   │       └── users/
│   │   │           ├── page.tsx                    # user list
│   │   │           ├── new/page.tsx                # create user
│   │   │           └── [id]/page.tsx               # edit user
│   │   └── api/auth/callback/route.ts              # Supabase auth callback
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx                         # sidebar nav
│   │   │   └── navbar.tsx                          # top navbar
│   │   ├── ui/
│   │   │   ├── button.tsx                          # button component
│   │   │   ├── input.tsx                           # input + label
│   │   │   ├── card.tsx                            # card container
│   │   │   ├── badge.tsx                           # status badge
│   │   │   ├── modal.tsx                           # dialog/modal
│   │   │   └── toast.tsx                           # toast notifications
│   │   └── users/
│   │       ├── user-table.tsx                      # user data table
│   │       ├── user-form.tsx                       # create/edit form
│   │       └── delete-user-dialog.tsx              # confirm delete modal
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                           # browser client
│   │   │   ├── server.ts                           # server client (SSR)
│   │   │   └── admin.ts                            # admin client (service_role)
│   │   └── utils.ts                                # cn(), formatDate()
│   ├── actions/
│   │   ├── auth.ts                                 # login, logout, forgot-password
│   │   └── users.ts                                # getUsers, createUser, updateUser, deleteUser, getRoles, assignRole
│   ├── types/
│   │   └── index.ts                                # Profile, Role, Permission, UserWithRoles, ActionResult
│   └── middleware.ts                               # protect /dashboard routes
├── supabase/
│   └── migrations/
│       └── 001_profiles_roles_permissions.sql     # full DB schema + RLS + seed
└── public/
    └── logo/
        ├── onlyLogo.svg
        └── logowithName.svg
```

---

## Task 1: Scaffold Next.js 15 App

**Files:**
- Create: entire project via `create-next-app`
- Create: `.env.local`
- Create: `.env.example`
- Create: `public/logo/` (move assets)

- [ ] **Step 1: Scaffold into existing directory (answer "y" to any prompts)**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
echo "y" | npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git 2>&1 | tail -20
```

Expected: Project scaffolded. Should see "Success!" or similar.

- [ ] **Step 2: Install dependencies**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
npm install @supabase/supabase-js @supabase/ssr clsx tailwind-merge lucide-react
```

Expected: Dependencies installed with no peer dep errors.

- [ ] **Step 3: Move branding assets to public/**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
mkdir -p public/logo
cp logo/onlyLogo.svg public/logo/onlyLogo.svg
cp logo/logowithName.svg public/logo/logowithName.svg
cp "logo/Leafclutch Logo.png" public/logo/leafclutch-logo.png
cp favicon.ico src/app/favicon.ico
```

- [ ] **Step 4: Create `.env.local`**

Write the file `/home/sid/leafclutch/hamro_hisabKitab_Simple/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://hmxhyxugyhhtgxnteprk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteGh5eHVneWhodGd4bnRlcHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzU0NDEsImV4cCI6MjA5NDQ1MTQ0MX0.VZn2oEXzKAI3mM4jxoFjePTbd4yyFHy-NVZaBzr2b_Q
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteGh5eHVneWhodGd4bnRlcHJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg3NTQ0MSwiZXhwIjoyMDk0NDUxNDQxfQ.9ZMQrkGYkTs5iuFVq_jxgInHDMX1UJbKXAZTmaMrNuI
```

- [ ] **Step 5: Create `.env.example`**

Write the file `/home/sid/leafclutch/hamro_hisabKitab_Simple/.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

- [ ] **Step 6: Add `.env.local` to `.gitignore`**

Ensure `.gitignore` contains:
```
.env.local
.env*.local
```

Run: `grep -n "env.local" /home/sid/leafclutch/hamro_hisabKitab_Simple/.gitignore`
Expected: Line showing `.env.local` is already gitignored (Next.js adds it by default).

- [ ] **Step 7: Verify build compiles**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | tail -10
```

Expected: Build succeeds (or only shows known Next.js default warnings).

- [ ] **Step 8: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add package.json package-lock.json next.config.ts tsconfig.json tailwind.config.ts .eslintrc.json postcss.config.mjs .env.example public/logo/
git commit -m "feat: scaffold Next.js 15 app with Supabase dependencies"
```

---

## Task 2: TypeScript Types + Supabase Clients + Utils

**Files:**
- Create: `src/types/index.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create TypeScript types**

Write `src/types/index.ts`:
```typescript
export type Role = {
  id: string
  name: string
  description: string | null
  created_at: string
}

export type Permission = {
  id: string
  module: string
  action: string
  created_at: string
}

export type Profile = {
  id: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type UserWithRoles = Profile & {
  roles: Role[]
}

export type ActionResult<T = null> = {
  success: boolean
  data?: T
  error?: string
}
```

- [ ] **Step 2: Create browser Supabase client**

Write `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Create server Supabase client**

Write `src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — cookie writes ignored
          }
        },
      },
    }
  )
}
```

- [ ] **Step 4: Create admin Supabase client (server-only)**

Write `src/lib/supabase/admin.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

- [ ] **Step 5: Create utils**

Write `src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}
```

- [ ] **Step 6: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/types/ src/lib/
git commit -m "feat: add Supabase clients, TypeScript types, and utils"
```

---

## Task 3: Database Schema + RLS + Seed Data

**Files:**
- Create: `supabase/migrations/001_profiles_roles_permissions.sql`

- [ ] **Step 1: Write the migration SQL**

Write `supabase/migrations/001_profiles_roles_permissions.sql`:
```sql
-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PERMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'approve')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(module, action)
);

-- ============================================================
-- ROLE_PERMISSIONS (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- USER_ROLES (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can update own profile or admins update any"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.is_admin());

-- Roles policies
CREATE POLICY "Authenticated can view roles"
  ON public.roles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage roles"
  ON public.roles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Permissions policies
CREATE POLICY "Authenticated can view permissions"
  ON public.permissions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can view role_permissions"
  ON public.role_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage role_permissions"
  ON public.role_permissions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage user_roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- SEED: Default roles and permissions
-- ============================================================
INSERT INTO public.roles (name, description) VALUES
  ('admin',   'Full system access — can manage users, all finance modules, and settings'),
  ('manager', 'Can create/edit finance records and approve transactions'),
  ('staff',   'Read and create access; cannot approve or delete')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.permissions (module, action) VALUES
  ('users',        'create'), ('users',        'read'), ('users',        'update'), ('users',        'delete'),
  ('projects',     'create'), ('projects',     'read'), ('projects',     'update'), ('projects',     'delete'), ('projects',     'approve'),
  ('training',     'create'), ('training',     'read'), ('training',     'update'), ('training',     'delete'), ('training',     'approve'),
  ('transactions', 'create'), ('transactions', 'read'), ('transactions', 'update'), ('transactions', 'delete'), ('transactions', 'approve'),
  ('withdrawals',  'create'), ('withdrawals',  'read'), ('withdrawals',  'update'), ('withdrawals',  'delete'), ('withdrawals',  'approve'),
  ('reports',      'read')
ON CONFLICT (module, action) DO NOTHING;
```

- [ ] **Step 2: Run SQL on Supabase dashboard**

Open: https://supabase.com/dashboard/project/hmxhyxugyhhtgxnteprk/sql/new

Paste the full content of `supabase/migrations/001_profiles_roles_permissions.sql` and click **Run**.

Expected: No errors. All tables visible in Table Editor.

- [ ] **Step 3: Commit migration**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add supabase/
git commit -m "feat: add DB schema — profiles, roles, permissions with RLS"
```

---

## Task 4: Global Styles + Tailwind Theme

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Update globals.css with CSS custom properties**

Write `src/app/globals.css`:
```css
@import "tailwindcss";

:root {
  --background: #f8fafc;
  --foreground: #0f172a;
  --sidebar-bg: #0f172a;
  --sidebar-fg: #cbd5e1;
  --sidebar-active: #1e293b;
  --sidebar-accent: #38bdf8;
  --card-bg: #ffffff;
  --card-border: #e2e8f0;
  --primary: #0ea5e9;
  --primary-hover: #0284c7;
  --destructive: #ef4444;
  --muted: #94a3b8;
  --muted-bg: #f1f5f9;
  --radius: 0.5rem;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}
```

- [ ] **Step 2: Verify build still passes**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | grep -E "(error|Error|✓|Failed)" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/app/globals.css tailwind.config.ts
git commit -m "feat: add global CSS design tokens and Tailwind theme"
```

---

## Task 5: Middleware + Auth Callback

**Files:**
- Create: `src/middleware.ts`
- Create: `src/app/api/auth/callback/route.ts`

- [ ] **Step 1: Create route protection middleware**

Write `src/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/forgot-password')

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|logo|api/auth).*)',
  ],
}
```

- [ ] **Step 2: Create Supabase auth callback route**

Write `src/app/api/auth/callback/route.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/middleware.ts src/app/api/
git commit -m "feat: add middleware for route protection and auth callback"
```

---

## Task 6: Auth Server Actions

**Files:**
- Create: `src/actions/auth.ts`

- [ ] **Step 1: Write auth server actions**

Write `src/actions/auth.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/actions/auth.ts
git commit -m "feat: add auth server actions — login, logout, forgot password"
```

---

## Task 7: Reusable UI Components

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/modal.tsx`

- [ ] **Step 1: Button component**

Write `src/components/ui/button.tsx`:
```typescript
import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:     'bg-sky-500 text-white hover:bg-sky-600 shadow-sm',
  secondary:   'bg-slate-100 text-slate-800 hover:bg-slate-200',
  ghost:       'bg-transparent text-slate-600 hover:bg-slate-100',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
```

- [ ] **Step 2: Input component**

Write `src/components/ui/input.tsx`:
```typescript
import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent',
          'disabled:bg-slate-50 disabled:cursor-not-allowed',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
)
Input.displayName = 'Input'
```

- [ ] **Step 3: Card component**

Write `src/components/ui/card.tsx`:
```typescript
import { cn } from '@/lib/utils'
import { type HTMLAttributes } from 'react'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between p-6 pb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 pb-6', className)} {...props}>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Badge component**

Write `src/components/ui/badge.tsx`:
```typescript
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info'

const variantClasses: Record<BadgeVariant, string> = {
  default:     'bg-slate-100 text-slate-700',
  success:     'bg-emerald-50 text-emerald-700',
  warning:     'bg-amber-50 text-amber-700',
  destructive: 'bg-red-50 text-red-700',
  info:        'bg-sky-50 text-sky-700',
}

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variantClasses[variant], className)}>
      {children}
    </span>
  )
}
```

- [ ] **Step 5: Modal component**

Write `src/components/ui/modal.tsx`:
```typescript
'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={cn('relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl', className)}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/components/ui/
git commit -m "feat: add reusable UI components — Button, Input, Card, Badge, Modal"
```

---

## Task 8: Auth UI — Login + Forgot Password Pages

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/forgot-password/page.tsx`

- [ ] **Step 1: Auth layout**

Write `src/app/(auth)/layout.tsx`:
```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/logo/onlyLogo.svg" alt="Hamro HisabKitab" className="h-12 w-12" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Hamro HisabKitab</h1>
            <p className="text-sm text-slate-400">Financial Intelligence Dashboard</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Login page**

Write `src/app/(auth)/login/page.tsx`:
```typescript
'use client'

import { login } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-8">
      <h2 className="mb-6 text-xl font-semibold text-white">Sign in to your account</h2>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@company.com"
          required
          autoComplete="email"
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-sky-400"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-300">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 pr-10 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <Button type="submit" loading={isPending} className="mt-1 w-full">
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-sky-400 hover:text-sky-300 hover:underline"
        >
          Forgot your password?
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Forgot password page**

Write `src/app/(auth)/forgot-password/page.tsx`:
```typescript
'use client'

import { forgotPassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await forgotPassword(formData)
      if (result?.error) setError(result.error)
      else setSent(true)
    })
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-8">
      <Link
        href="/login"
        className="mb-5 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft size={14} /> Back to login
      </Link>

      <h2 className="mb-2 text-xl font-semibold text-white">Reset your password</h2>
      <p className="mb-6 text-sm text-slate-400">
        Enter your email and we'll send you a reset link.
      </p>

      {sent ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-400" />
          <p className="text-sm text-slate-300">
            Check your email for the reset link. It may take a minute.
          </p>
        </div>
      ) : (
        <form action={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email address"
            placeholder="you@company.com"
            required
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-sky-400"
          />

          {error && (
            <p className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" loading={isPending} className="mt-1 w-full">
            {isPending ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/app/\(auth\)/
git commit -m "feat: add login and forgot-password pages"
```

---

## Task 9: Dashboard Layout — Sidebar + Navbar

**Files:**
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/navbar.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Root layout**

Write `src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hamro HisabKitab',
  description: 'Financial Intelligence Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Sidebar component**

Write `src/components/layout/sidebar.tsx`:
```typescript
'use client'

import { cn } from '@/lib/utils'
import {
  BarChart3,
  BookOpen,
  Briefcase,
  ChevronLeft,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { href: '/',                          icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/training',                  icon: BookOpen,        label: 'Training' },
  { href: '/projects',                  icon: Briefcase,       label: 'Projects' },
  { href: '/transactions',              icon: Wallet,          label: 'Transactions' },
  { href: '/reports',                   icon: BarChart3,       label: 'Reports' },
  { href: '/settings/users',            icon: Users,           label: 'Users',    section: 'Settings' },
  { href: '/settings',                  icon: Settings,        label: 'Settings', section: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const mainItems = navItems.filter(i => !i.section)
  const settingsItems = navItems.filter(i => i.section === 'Settings')

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-slate-900 text-slate-300 transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-slate-800', collapsed && 'justify-center px-2')}>
        <Image src="/logo/onlyLogo.svg" alt="Logo" width={32} height={32} className="flex-shrink-0" />
        {!collapsed && (
          <span className="font-bold text-white text-sm leading-tight">
            Hamro<br />HisabKitab
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <NavGroup items={mainItems} pathname={pathname} collapsed={collapsed} />
        {!collapsed && (
          <p className="mt-4 mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Settings
          </p>
        )}
        <NavGroup items={settingsItems} pathname={pathname} collapsed={collapsed} />
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-slate-800 p-2">
        <button
          onClick={() => setCollapsed(v => !v)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={16} className={cn('transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>
    </aside>
  )
}

function NavGroup({
  items,
  pathname,
  collapsed,
}: {
  items: typeof navItems
  pathname: string
  collapsed: boolean
}) {
  return (
    <ul className="flex flex-col gap-0.5 px-2">
      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-sky-500/10 text-sky-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 3: Navbar component**

Write `src/components/layout/navbar.tsx`:
```typescript
'use client'

import { logout } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import { useTransition } from 'react'

interface NavbarProps {
  userEmail?: string
  userName?: string
}

export function Navbar({ userEmail, userName }: NavbarProps) {
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <User size={14} />
          </div>
          <div className="text-right">
            {userName && <p className="text-xs font-medium text-slate-800">{userName}</p>}
            {userEmail && <p className="text-[10px] text-slate-500">{userEmail}</p>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          loading={isPending}
          title="Sign out"
        >
          <LogOut size={15} />
        </Button>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Dashboard layout**

Write `src/app/(dashboard)/layout.tsx`:
```typescript
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName: string | undefined
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    userName = profile?.full_name || undefined
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar userEmail={user?.email} userName={userName} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Dashboard home placeholder**

Write `src/app/(dashboard)/page.tsx`:
```typescript
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { BarChart3, DollarSign, TrendingUp, Users } from 'lucide-react'

const stats = [
  { label: 'Total Revenue',  value: '—',  icon: DollarSign,  color: 'text-sky-600',     bg: 'bg-sky-50' },
  { label: 'Total Expenses', value: '—',  icon: TrendingUp,  color: 'text-amber-600',   bg: 'bg-amber-50' },
  { label: 'Net Profit',     value: '—',  icon: BarChart3,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Active Users',   value: '—',  icon: Users,       color: 'text-violet-600',  bg: 'bg-violet-50' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Financial overview — more data coming soon.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
                </div>
                <div className={`rounded-xl p-3 ${bg}`}>
                  <Icon size={22} className={color} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Recent Transactions</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">No transactions yet. Finance modules coming in Phase 2.</p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/app/layout.tsx src/app/\(dashboard\)/ src/components/layout/
git commit -m "feat: add dashboard layout with sidebar and navbar"
```

---

## Task 10: User Management — Server Actions

**Files:**
- Create: `src/actions/users.ts`

- [ ] **Step 1: Write user CRUD server actions**

Write `src/actions/users.ts`:
```typescript
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, UserWithRoles, Role } from '@/types'
import { revalidatePath } from 'next/cache'

export async function getUsers(): Promise<ActionResult<UserWithRoles[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        roles:user_roles(
          role:roles(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }

    const users = (data ?? []).map((u: any) => ({
      ...u,
      roles: (u.roles ?? []).map((r: any) => r.role).filter(Boolean),
    }))

    return { success: true, data: users }
  } catch (err) {
    return { success: false, error: 'Failed to fetch users' }
  }
}

export async function getRoles(): Promise<ActionResult<Role[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('roles').select('*').order('name')
    if (error) return { success: false, error: error.message }
    return { success: true, data: data ?? [] }
  } catch {
    return { success: false, error: 'Failed to fetch roles' }
  }
}

export async function createUser(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const email = formData.get('email') as string
  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string | null
  const password = formData.get('password') as string
  const roleId = formData.get('role_id') as string | null

  if (!email || !fullName || !password) {
    return { success: false, error: 'Email, name, and password are required' }
  }

  try {
    const admin = createAdminClient()

    // Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authError) return { success: false, error: authError.message }

    const userId = authData.user.id

    // Update profile (trigger creates it, we just fill in extras)
    const { error: profileError } = await admin
      .from('profiles')
      .update({ full_name: fullName, phone: phone || null })
      .eq('id', userId)

    if (profileError) return { success: false, error: profileError.message }

    // Assign role if provided
    if (roleId) {
      const { error: roleError } = await admin
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleId })

      if (roleError) return { success: false, error: roleError.message }
    }

    revalidatePath('/settings/users')
    return { success: true, data: { id: userId } }
  } catch {
    return { success: false, error: 'Failed to create user' }
  }
}

export async function updateUser(
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string | null
  const isActive = formData.get('is_active') === 'true'
  const roleId = formData.get('role_id') as string | null

  if (!fullName) return { success: false, error: 'Name is required' }

  try {
    const admin = createAdminClient()

    const { error: profileError } = await admin
      .from('profiles')
      .update({ full_name: fullName, phone: phone || null, is_active: isActive })
      .eq('id', userId)

    if (profileError) return { success: false, error: profileError.message }

    // Replace all roles for this user
    await admin.from('user_roles').delete().eq('user_id', userId)
    if (roleId) {
      const { error: roleError } = await admin
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleId })
      if (roleError) return { success: false, error: roleError.message }
    }

    revalidatePath('/settings/users')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update user' }
  }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    const admin = createAdminClient()

    // Delete from auth (cascades to profiles via FK)
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/settings/users')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to delete user' }
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/actions/users.ts
git commit -m "feat: add user CRUD server actions using Supabase Admin API"
```

---

## Task 11: User Management — UI Components

**Files:**
- Create: `src/components/users/user-table.tsx`
- Create: `src/components/users/user-form.tsx`
- Create: `src/components/users/delete-user-dialog.tsx`

- [ ] **Step 1: User table component**

Write `src/components/users/user-table.tsx`:
```typescript
'use client'

import { deleteUser } from '@/actions/users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { UserWithRoles } from '@/types'
import { Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { DeleteUserDialog } from './delete-user-dialog'

interface UserTableProps {
  users: UserWithRoles[]
}

export function UserTable({ users }: UserTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<UserWithRoles | null>(null)
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')

  const filtered = users.filter(
    u =>
      u.full_name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  )

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      await deleteUser(deleteTarget.id)
      setDeleteTarget(null)
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full max-w-sm rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <span className="text-sm text-slate-500">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{user.full_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.roles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map(r => (
                          <Badge key={r.id} variant="info">{r.name}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">No role</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.is_active ? 'success' : 'default'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/settings/users/${user.id}`}>
                        <Button variant="ghost" size="sm" title="Edit user">
                          <Edit2 size={14} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(user)}
                        className="text-red-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete user"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DeleteUserDialog
        open={!!deleteTarget}
        userName={deleteTarget?.full_name ?? deleteTarget?.email ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={isPending}
      />
    </>
  )
}
```

- [ ] **Step 2: Delete confirmation dialog**

Write `src/components/users/delete-user-dialog.tsx`:
```typescript
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { AlertTriangle } from 'lucide-react'

interface DeleteUserDialogProps {
  open: boolean
  userName: string
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

export function DeleteUserDialog({ open, userName, onClose, onConfirm, loading }: DeleteUserDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="Delete user">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="font-medium text-red-800">This action cannot be undone</p>
            <p className="mt-0.5 text-sm text-red-600">
              You are about to permanently delete <strong>{userName}</strong> and all their data.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading}>
            Delete user
          </Button>
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 3: User form component**

Write `src/components/users/user-form.tsx`:
```typescript
'use client'

import { createUser, updateUser } from '@/actions/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Role, UserWithRoles } from '@/types'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface UserFormProps {
  roles: Role[]
  user?: UserWithRoles
}

export function UserForm({ roles, user }: UserFormProps) {
  const isEditing = !!user
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = isEditing
        ? await updateUser(user.id, formData)
        : await createUser(formData)

      if (!result.success) {
        setError(result.error ?? 'Something went wrong')
      } else {
        router.push('/settings/users')
      }
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5 max-w-lg">
      <Input
        id="full_name"
        name="full_name"
        label="Full name"
        placeholder="Jane Doe"
        defaultValue={user?.full_name ?? ''}
        required
      />

      <Input
        id="email"
        name="email"
        type="email"
        label="Email address"
        placeholder="jane@company.com"
        defaultValue={user?.email ?? ''}
        required
        disabled={isEditing}
      />

      <Input
        id="phone"
        name="phone"
        type="tel"
        label="Phone (optional)"
        placeholder="+977 98XXXXXXXX"
        defaultValue={user?.phone ?? ''}
      />

      {!isEditing && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 characters"
              required
              minLength={8}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="role_id" className="text-sm font-medium text-slate-700">
          Role
        </label>
        <select
          id="role_id"
          name="role_id"
          defaultValue={user?.roles[0]?.id ?? ''}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">No role assigned</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.name} {role.description ? `— ${role.description}` : ''}
            </option>
          ))}
        </select>
      </div>

      {isEditing && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select
            name="is_active"
            defaultValue={user.is_active ? 'true' : 'false'}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={isPending}>
          {isPending ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save changes' : 'Create user')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/settings/users')}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/components/users/
git commit -m "feat: add user table, form, and delete dialog components"
```

---

## Task 12: User Management — Pages

**Files:**
- Create: `src/app/(dashboard)/settings/users/page.tsx`
- Create: `src/app/(dashboard)/settings/users/new/page.tsx`
- Create: `src/app/(dashboard)/settings/users/[id]/page.tsx`

- [ ] **Step 1: User list page**

Write `src/app/(dashboard)/settings/users/page.tsx`:
```typescript
import { getUsers } from '@/actions/users'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { UserTable } from '@/components/users/user-table'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const result = await getUsers()
  const users = result.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">Manage system users and their roles.</p>
        </div>
        <Link href="/settings/users/new">
          <Button>
            <UserPlus size={16} />
            Add user
          </Button>
        </Link>
      </div>

      {result.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {result.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">All users</h2>
        </CardHeader>
        <CardContent>
          <UserTable users={users} />
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Create user page**

Write `src/app/(dashboard)/settings/users/new/page.tsx`:
```typescript
import { getRoles } from '@/actions/users'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { UserForm } from '@/components/users/user-form'

export default async function NewUserPage() {
  const rolesResult = await getRoles()
  const roles = rolesResult.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add user</h1>
        <p className="text-sm text-slate-500">Create a new user account and assign a role.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">User details</h2>
        </CardHeader>
        <CardContent>
          <UserForm roles={roles} />
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Edit user page**

Write `src/app/(dashboard)/settings/users/[id]/page.tsx`:
```typescript
import { getRoles, getUsers } from '@/actions/users'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { UserForm } from '@/components/users/user-form'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params
  const [usersResult, rolesResult] = await Promise.all([getUsers(), getRoles()])

  const user = usersResult.data?.find(u => u.id === id)
  if (!user) notFound()

  const roles = rolesResult.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit user</h1>
        <p className="text-sm text-slate-500">Update details for {user.full_name || user.email}.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">User details</h2>
        </CardHeader>
        <CardContent>
          <UserForm roles={roles} user={user} />
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Final build check**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple && npm run build 2>&1 | tail -20
```

Expected: Build succeeds. Note any TypeScript or lint errors and fix them.

- [ ] **Step 5: Commit**

```bash
cd /home/sid/leafclutch/hamro_hisabKitab_Simple
git add src/app/\(dashboard\)/settings/
git commit -m "feat: add user management pages — list, create, edit"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Auth (login, forgot password with eye icon ✓), protected routes ✓, role system ✓, user CRUD ✓, DB schema ✓, RLS ✓, reusable UI components ✓
- [x] **Placeholder scan:** No TBDs or incomplete sections
- [x] **Type consistency:** `UserWithRoles`, `Role`, `Profile`, `ActionResult` used consistently across all tasks
- [x] **Scope:** Focused on Phase 1 only — Finance modules, Approval Workflow, etc. are Phase 2+

---
