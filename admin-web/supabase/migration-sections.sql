-- ============================================
-- Migration: Sections & Exercise Catalog
-- ============================================

-- 1. Exercise Catalog (global)
CREATE TABLE IF NOT EXISTS exercise_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  youtube_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE exercise_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_catalog_select_all" ON exercise_catalog
  FOR SELECT USING (true);

CREATE POLICY "exercise_catalog_insert_admin" ON exercise_catalog
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR super_admin = true))
  );

CREATE POLICY "exercise_catalog_update_admin" ON exercise_catalog
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR super_admin = true))
  );

CREATE POLICY "exercise_catalog_delete_admin" ON exercise_catalog
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR super_admin = true))
  );

-- 2. Routine Sections
CREATE TABLE IF NOT EXISTS routine_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  value_label TEXT,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE routine_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routine_sections_select" ON routine_sections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM routines WHERE id = routine_id)
  );

CREATE POLICY "routine_sections_insert_admin" ON routine_sections
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR super_admin = true))
  );

CREATE POLICY "routine_sections_update_admin" ON routine_sections
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR super_admin = true))
  );

CREATE POLICY "routine_sections_delete_admin" ON routine_sections
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR super_admin = true))
  );

-- 3. Section Exercises (exercises assigned to a section)
CREATE TABLE IF NOT EXISTS section_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES routine_sections(id) ON DELETE CASCADE,
  exercise_catalog_id UUID REFERENCES exercise_catalog(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  valor TEXT,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE section_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "section_exercises_select" ON section_exercises
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM routine_sections WHERE id = section_id)
  );

CREATE POLICY "section_exercises_insert_admin" ON section_exercises
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR super_admin = true))
  );

CREATE POLICY "section_exercises_update_admin" ON section_exercises
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR super_admin = true))
  );

CREATE POLICY "section_exercises_delete_admin" ON section_exercises
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR super_admin = true))
  );
