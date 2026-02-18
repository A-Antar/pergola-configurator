
-- App roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'sales_rep');

-- Tables first (no functions yet)

-- Companies
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  branding jsonb DEFAULT '{}',
  ghl_webhook_url text,
  ghl_chat_embed text,
  active_catalog_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- App users
CREATE TABLE public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Catalog versions
CREATE TABLE public.catalog_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  version text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_versions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.companies
  ADD CONSTRAINT fk_active_catalog_version
  FOREIGN KEY (active_catalog_version_id) REFERENCES public.catalog_versions(id);

-- SKUs
CREATE TABLE public.skus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_version_id uuid NOT NULL REFERENCES public.catalog_versions(id) ON DELETE CASCADE,
  sku_code text NOT NULL,
  category text NOT NULL,
  meta jsonb DEFAULT '{}'
);
ALTER TABLE public.skus ENABLE ROW LEVEL SECURITY;

-- Catalog profiles
CREATE TABLE public.catalog_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_version_id uuid NOT NULL REFERENCES public.catalog_versions(id) ON DELETE CASCADE,
  kind text NOT NULL,
  polyline_mm jsonb NOT NULL DEFAULT '[]',
  meta jsonb DEFAULT '{}'
);
ALTER TABLE public.catalog_profiles ENABLE ROW LEVEL SECURITY;

-- Rules
CREATE TABLE public.rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_version_id uuid NOT NULL REFERENCES public.catalog_versions(id) ON DELETE CASCADE,
  rule_type text NOT NULL,
  severity text NOT NULL DEFAULT 'error' CHECK (severity IN ('error','warning','info')),
  json jsonb NOT NULL DEFAULT '{}'
);
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;

-- Projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','quoted','sent','approved','won','lost')),
  customer jsonb NOT NULL DEFAULT '{}',
  site jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Revisions
CREATE TABLE public.revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  catalog_version_id uuid REFERENCES public.catalog_versions(id),
  created_by uuid REFERENCES auth.users(id),
  config jsonb NOT NULL DEFAULT '{}',
  parts jsonb DEFAULT '[]',
  pricing jsonb DEFAULT '{}',
  site_context jsonb DEFAULT '{}',
  scan_placeholder jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;

-- Share tokens
CREATE TABLE public.share_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id uuid NOT NULL REFERENCES public.revisions(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

-- Exports
CREATE TABLE public.exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id uuid NOT NULL REFERENCES public.revisions(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('pdf','glb','screenshot')),
  storage_path text NOT NULL,
  meta jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

-- Events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  revision_id uuid REFERENCES public.revisions(id) ON DELETE SET NULL,
  type text NOT NULL,
  meta jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Now create helper functions (tables exist)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1
$$;

-- RLS POLICIES

-- Companies
CREATE POLICY "Users see own company" ON public.companies
  FOR SELECT TO authenticated USING (id = public.get_user_company_id());
CREATE POLICY "Admins update own company" ON public.companies
  FOR UPDATE TO authenticated USING (id = public.get_user_company_id() AND public.has_role(auth.uid(), 'admin'));

-- App users
CREATE POLICY "Users see company members" ON public.app_users
  FOR SELECT TO authenticated USING (company_id = public.get_user_company_id());
CREATE POLICY "Users insert own profile" ON public.app_users
  FOR INSERT TO authenticated WITH CHECK (auth_user_id = auth.uid());

-- User roles
CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Catalog versions
CREATE POLICY "Users see company catalogs" ON public.catalog_versions
  FOR SELECT TO authenticated USING (company_id = public.get_user_company_id());
CREATE POLICY "Admins manage catalogs" ON public.catalog_versions
  FOR ALL TO authenticated USING (company_id = public.get_user_company_id() AND public.has_role(auth.uid(), 'admin'));

-- SKUs
CREATE POLICY "Users see company skus" ON public.skus
  FOR SELECT TO authenticated
  USING (catalog_version_id IN (SELECT id FROM public.catalog_versions WHERE company_id = public.get_user_company_id()));

-- Catalog profiles
CREATE POLICY "Users see company profiles" ON public.catalog_profiles
  FOR SELECT TO authenticated
  USING (catalog_version_id IN (SELECT id FROM public.catalog_versions WHERE company_id = public.get_user_company_id()));

-- Rules
CREATE POLICY "Users see company rules" ON public.rules
  FOR SELECT TO authenticated
  USING (catalog_version_id IN (SELECT id FROM public.catalog_versions WHERE company_id = public.get_user_company_id()));

-- Projects
CREATE POLICY "Users see company projects" ON public.projects
  FOR SELECT TO authenticated USING (company_id = public.get_user_company_id());
CREATE POLICY "Users create company projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users update company projects" ON public.projects
  FOR UPDATE TO authenticated USING (company_id = public.get_user_company_id());
CREATE POLICY "Admins delete projects" ON public.projects
  FOR DELETE TO authenticated USING (company_id = public.get_user_company_id() AND public.has_role(auth.uid(), 'admin'));

-- Revisions
CREATE POLICY "Users see project revisions" ON public.revisions
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE company_id = public.get_user_company_id()));
CREATE POLICY "Users create revisions" ON public.revisions
  FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE company_id = public.get_user_company_id()));

-- Share tokens
CREATE POLICY "Users manage share tokens" ON public.share_tokens
  FOR ALL TO authenticated
  USING (revision_id IN (
    SELECT r.id FROM public.revisions r JOIN public.projects p ON r.project_id = p.id
    WHERE p.company_id = public.get_user_company_id()
  ));

-- Exports
CREATE POLICY "Users see exports" ON public.exports
  FOR SELECT TO authenticated
  USING (revision_id IN (
    SELECT r.id FROM public.revisions r JOIN public.projects p ON r.project_id = p.id
    WHERE p.company_id = public.get_user_company_id()
  ));
CREATE POLICY "Users create exports" ON public.exports
  FOR INSERT TO authenticated
  WITH CHECK (revision_id IN (
    SELECT r.id FROM public.revisions r JOIN public.projects p ON r.project_id = p.id
    WHERE p.company_id = public.get_user_company_id()
  ));

-- Events
CREATE POLICY "Users see company events" ON public.events
  FOR SELECT TO authenticated USING (company_id = public.get_user_company_id());
CREATE POLICY "Users create events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (company_id = public.get_user_company_id());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('exports', 'exports', false);
CREATE POLICY "Auth users upload exports" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'exports');
CREATE POLICY "Auth users read exports" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'exports');
