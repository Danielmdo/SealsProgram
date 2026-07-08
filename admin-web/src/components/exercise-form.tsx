'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

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

export function ExerciseForm({
  exercise,
  index,
  onChange,
  onRemove,
}: {
  exercise: Exercise
  index: number
  onChange: (exercise: Exercise) => void
  onRemove: () => void
}) {
  const update = (field: keyof Exercise, value: string | number) => {
    onChange({ ...exercise, [field]: value })
  }

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Ejercicio #{index + 1}</span>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium">Nombre del ejercicio</label>
          <Input value={exercise.name} onChange={e => update('name', e.target.value)} placeholder="Ej: Sentadillas" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Series</label>
          <Input type="number" value={exercise.sets || ''} onChange={e => update('sets', parseInt(e.target.value) || 0)} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Repeticiones</label>
          <Input value={exercise.reps} onChange={e => update('reps', e.target.value)} placeholder="Ej: 10, AMRAP, 21-15-9" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Peso</label>
          <Input value={exercise.weight} onChange={e => update('weight', e.target.value)} placeholder="Ej: 50kg, BW, 24kg" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">URL de YouTube</label>
          <Input value={exercise.youtube_url} onChange={e => update('youtube_url', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium">Notas</label>
          <Input value={exercise.notes} onChange={e => update('notes', e.target.value)} placeholder="Notas adicionales..." />
        </div>
      </div>
    </div>
  )
}
