-- Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Super admin can manage roles" ON profiles;
DROP POLICY IF EXISTS "Admins can view assigned users" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert routines" ON routines;
DROP POLICY IF EXISTS "Admins can update routines" ON routines;
DROP POLICY IF EXISTS "Admins can delete routines" ON routines;
DROP POLICY IF EXISTS "Anyone can view routines" ON routines;
DROP POLICY IF EXISTS "Admins can insert exercises" ON exercises;
DROP POLICY IF EXISTS "Admins can update exercises" ON exercises;
DROP POLICY IF EXISTS "Admins can delete exercises" ON exercises;
DROP POLICY IF EXISTS "Anyone can view exercises" ON exercises;

-- Función helper en schema public (para evitar permisos en auth)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND super_admin = true);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Super admin can manage roles"
  ON profiles FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ROUTINES POLICIES
CREATE POLICY "Anyone can view routines"
  ON routines FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert routines"
  ON routines FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update routines"
  ON routines FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete routines"
  ON routines FOR DELETE
  USING (public.is_admin());

-- EXERCISES POLICIES
CREATE POLICY "Anyone can view exercises"
  ON exercises FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert exercises"
  ON exercises FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update exercises"
  ON exercises FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete exercises"
  ON exercises FOR DELETE
  USING (public.is_admin());
