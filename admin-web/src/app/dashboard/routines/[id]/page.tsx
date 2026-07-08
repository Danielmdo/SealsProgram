'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExerciseForm } from '@/components/exercise-form'
import { YouTubeEmbed } from '@/components/youtube-embed'
import { ArrowLeft, Plus, Save, Trash2, Edit3, Play } from 'lucide-react'
import Link from 'next/link'

type Routine = {
  id: string
  date: string
  title: string
  notes: string | null
}

type Exercise = {
  id?: string
  name: string
  sets: number
  reps: string
  weight: string
  youtube_url: string
  notes: string
  sort_order: number
}

export default function RoutineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editExercises, setEditExercises] = useState<Exercise[]>([])
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const [viewingVideo, setViewingVideo] = useState<string | null>(null)

  useEffect(() => {
    loadRoutine()
    loadProfile()
  }, [params.id])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    setProfile(data)
  }

  async function loadRoutine() {
    const { data: r } = await supabase.from('routines').select('*').eq('id', params.id).single()
    if (r) {
      setRoutine(r)
      setEditTitle(r.title)
      setEditNotes(r.notes || '')
    }

    const { data: ex } = await supabase
      .from('exercises')
      .select('*')
      .eq('routine_id', params.id)
      .order('sort_order', { ascending: true })
    setExercises(ex || [])
    setEditExercises(ex?.map(e => ({ ...e })) || [])
  }

  const isAdmin = profile?.role === 'admin'

  const addExercise = () => {
    setEditExercises([...editExercises, { id: '', name: '', sets: 0, reps: '', weight: '', youtube_url: '', notes: '', sort_order: editExercises.length }])
  }

  const updateExercise = (index: number, exercise: Exercise) => {
    const updated = [...editExercises]
    updated[index] = exercise
    setEditExercises(updated)
  }

  const removeExercise = (index: number) => {
    setEditExercises(editExercises.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!routine) return

    await supabase.from('routines').update({ title: editTitle, notes: editNotes }).eq('id', routine.id)

    for (const ex of editExercises) {
      if (ex.id) {
        await supabase.from('exercises').update({
          name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight,
          youtube_url: ex.youtube_url, notes: ex.notes, sort_order: ex.sort_order,
        }).eq('id', ex.id)
      } else {
        await supabase.from('exercises').insert({
          routine_id: routine.id, name: ex.name, sets: ex.sets, reps: ex.reps,
          weight: ex.weight, youtube_url: ex.youtube_url, notes: ex.notes, sort_order: ex.sort_order,
        })
      }
    }

    const newIds = editExercises.filter(e => e.id).map(e => e.id)
    const toDelete = exercises.filter(e => !newIds.includes(e.id)).map(e => e.id)
    if (toDelete.length > 0) {
      await supabase.from('exercises').delete().in('id', toDelete)
    }

    setEditing(false)
    loadRoutine()
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta rutina?')) return
    await supabase.from('routines').delete().eq('id', routine!.id)
    router.push('/dashboard')
    router.refresh()
  }

  if (!routine) return <p className="text-muted-foreground">Cargando...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{routine.title}</h1>
            <p className="text-muted-foreground text-sm">{routine.date}</p>
          </div>
        </div>
        {isAdmin && !editing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit3 className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
          </div>
        )}
        {isAdmin && editing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditing(false); loadRoutine() }}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Guardar
            </Button>
          </div>
        )}
      </div>

      {routine.notes && !editing && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{routine.notes}</p>
          </CardContent>
        </Card>
      )}

      {editing && (
        <Card>
          <CardHeader><CardTitle>Editar Rutina</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Título</label>
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Notas</label>
                <Input value={editNotes} onChange={e => setEditNotes(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ejercicios</h2>
          {editing && (
            <Button type="button" variant="outline" size="sm" onClick={addExercise}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          )}
        </div>

        {(editing ? editExercises : exercises).length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No hay ejercicios en esta rutina</p>
        ) : editing ? (
          <div className="space-y-3">
            {editExercises.map((ex, i) => (
              <ExerciseForm
                key={i}
                exercise={ex}
                index={i}
                onChange={e => updateExercise(i, e)}
                onRemove={() => removeExercise(i)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <Card key={ex.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-mono">{i + 1}.</span>
                        <h3 className="font-medium">{ex.name}</h3>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {ex.sets > 0 && <span>{ex.sets} series</span>}
                        {ex.reps && <span>{ex.reps} reps</span>}
                        {ex.weight && <span>{ex.weight}</span>}
                      </div>
                      {ex.notes && <p className="text-sm text-muted-foreground mt-1">{ex.notes}</p>}
                      {ex.youtube_url && (
                        <div className="mt-2">
                          {viewingVideo === ex.id ? (
                            <div>
                              <YouTubeEmbed url={ex.youtube_url} />
                              <Button variant="ghost" size="sm" className="mt-1" onClick={() => setViewingVideo(null)}>
                                Cerrar video
                              </Button>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => ex.id && setViewingVideo(ex.id)}>
                              <Play className="h-4 w-4 mr-1 text-red-500" />
                              Ver video
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
