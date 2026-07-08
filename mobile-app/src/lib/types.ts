export type Profile = {
  id: string
  name: string
  role: 'admin' | 'user'
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
