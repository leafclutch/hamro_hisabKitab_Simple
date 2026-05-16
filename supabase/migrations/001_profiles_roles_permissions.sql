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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

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
$$ LANGUAGE plpgsql SET search_path = '';

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
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

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
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage roles"
  ON public.roles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Permissions policies
CREATE POLICY "Authenticated can view permissions"
  ON public.permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can view role_permissions"
  ON public.role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

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
