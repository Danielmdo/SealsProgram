'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExerciseForm } from '@/components/exercise-form'
import { Plus, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

type Exercise = {
  name: string
  sets: number
  reps: string
  weight: string
  youtube_url: string
  notes: string
  sort_order: number
}

export default function NewRoutinePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [title, setTitle] = useState('Rutina del día')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: 0, reps: '', weight: '', youtube_url: '', notes: '', sort_order: exercises.length }])
  }

  const updateExercise = (index: number, exercise: Exercise) => {
    const updated = [...exercises]
    updated[index] = exercise
    setExercises(updated)
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const routineId = crypto.randomUUID()

    const { error: routineError } = await supabase.from('routines').insert({
      id: routineId,
      date,
      title,
      notes,
      created_by: user.id,
    })

    if (routineError) {
      alert('Error al guardar la rutina: ' + routineError.message)
      setSaving(false)
      return
    }

    if (exercises.length > 0) {
      const exercisesToInsert = exercises.map((ex, i) => ({
        routine_id: routineId,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        youtube_url: ex.youtube_url,
        notes: ex.notes,
        sort_order: i,
      }))

      const { error: exError } = await supabase.from('exercises').insert(exercisesToInsert)
      if (exError) {
        alert('Error al guardar ejercicios: ' + exError.message)
        setSaving(false)
        return
      }
    }

    router.push(`/dashboard/routines/${routineId}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nueva Rutina</h1>
          <p className="text-muted-foreground text-sm">Crea una nueva rutina para tus atletas</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Rutina</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Fecha</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Título</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Notas generales</label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas para la rutina..." />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ejercicios</h2>
          <Button type="button" variant="outline" size="sm" onClick={addExercise}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar Ejercicio
          </Button>
        </div>

        {exercises.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No hay ejercicios. Haz clic en "Agregar Ejercicio" para comenzar.
          </p>
        ) : (
          <div className="space-y-3">
            {exercises.map((ex, i) => (
              <ExerciseForm
                key={i}
                exercise={ex}
                index={i}
                onChange={e => updateExercise(i, e)}
                onRemove={() => removeExercise(i)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Link href="/dashboard">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving || !title || !date}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? 'Guardando...' : 'Guardar Rutina'}
        </Button>
      </div>
    </div>
  )
}
