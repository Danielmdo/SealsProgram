export type Profile = {
  id: string
  name: string
  role: 'admin' | 'user'
  super_admin: boolean
  trainer_id: string | null
  created_at: string
}

export type Routine = {
  id: string
  date: string
  title: string
  notes: string | null
  created_by: string
  created_at: string
}

export type Exercise = {
  id: string
  routine_id: string
  name: string
  sets: number
  reps: string
  weight: string
  youtube_url: string
  notes: string
  sort_order: number
}

export type CatalogExercise = {
  id: string
  name: string
  youtube_url: string | null
}

export type SectionExercise = {
  id: string
  section_id: string
  exercise_catalog_id: string
  sort_order: number
  valor: string
  descripcion: string
  exercise_catalog: CatalogExercise
}

export type RoutineSection = {
  id: string
  routine_id: string
  title: string
  sort_order: number
  value_label: string | null
  value: string | null
  section_exercises: SectionExercise[]
}
