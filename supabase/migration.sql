-- Migración para añadir super_admin y trainer_id
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS super_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_trainer_id ON profiles(trainer_id);

-- Asignar super_admin al primer admin creado
UPDATE profiles SET super_admin = true WHERE id = (SELECT id FROM profiles WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1);

-- Eliminar políticas antiguas y recrear (opcional, mejor desde schema.sql completo)
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Nueva política: solo super_admin puede cambiar roles
CREATE POLICY "Super admin can manage roles"
  ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND super_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND super_admin = true));

-- Política para que admins vean sus usuarios asignados
CREATE POLICY "Admins can view assigned users"
  ON profiles FOR SELECT
  USING (trainer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Recrear trigger (si se eliminó antes)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
