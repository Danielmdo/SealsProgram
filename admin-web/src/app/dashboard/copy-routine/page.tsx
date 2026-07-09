'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { Copy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Routine = {
  id: string
  date: string
  title: string
}

type Exercise = {
  name: string
  sets: number
  reps: string
  weight: string
  youtube_url: string
  notes: string
  sort_order: number
}

export default function CopyRoutinePage() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [selectedRoutine, setSelectedRoutine] = useState('')
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadRoutines()
  }, [])

  async function loadRoutines() {
    const { data, error } = await supabase
      .from('routines')
      .select('id, date, title')
      .order('date', { ascending: false })
    if (error) {
      console.error(error)
      return
    }
    setRoutines(data || [])
  }

  const handleCopy = async () => {
    if (!selectedRoutine || !targetDate) return
    setLoading(true)

    const { data: sourceRoutine } = await supabase
      .from('routines')
      .select('*')
      .eq('id', selectedRoutine)
      .single()

    if (!sourceRoutine) {
      alert('Rutina no encontrada')
      setLoading(false)
      return
    }

    const { data: sourceSections } = await supabase
      .from('routine_sections')
      .select('*')
      .eq('routine_id', selectedRoutine)
      .order('sort_order', { ascending: true })

    const { data: { user } } = await supabase.auth.getUser()

    const newRoutineId = crypto.randomUUID()
    const { error: routineError } = await supabase.from('routines').insert({
      id: newRoutineId,
      date: targetDate,
      title: `${sourceRoutine.title}`,
      notes: sourceRoutine.notes,
      created_by: user?.id,
    })

    if (routineError) {
      alert('Error al copiar rutina: ' + routineError.message)
      setLoading(false)
      return
    }

    if (sourceSections && sourceSections.length > 0) {
      for (const section of sourceSections) {
        const { data: sourceExercises } = await supabase
          .from('section_exercises')
          .select('*')
          .eq('section_id', section.id)
          .order('sort_order', { ascending: true })

        const { data: newSection } = await supabase.from('routine_sections').insert({
          routine_id: newRoutineId,
          title: section.title,
          sort_order: section.sort_order,
          value_label: section.value_label,
          value: section.value,
        }).select().single()

        if (newSection && sourceExercises) {
          await supabase.from('section_exercises').insert(
            sourceExercises.map(ex => ({
              section_id: newSection.id,
              exercise_catalog_id: ex.exercise_catalog_id,
              sort_order: ex.sort_order,
              valor: ex.valor,
              descripcion: ex.descripcion,
            }))
          )
        }
      }
    }

    router.push(`/dashboard/routines/${newRoutineId}`)
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
          <h1 className="text-2xl font-bold">Copiar Rutina</h1>
          <p className="text-muted-foreground text-sm">Copia una rutina completa a otra fecha</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar origen y destino</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Rutina de origen</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={selectedRoutine}
              onChange={e => setSelectedRoutine(e.target.value)}
            >
              <option value="">Selecciona una rutina...</option>
              {routines.map(r => (
                <option key={r.id} value={r.id}>
                  {r.date} - {r.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Fecha de destino</label>
            <Input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
            />
          </div>

          <Button
            onClick={handleCopy}
            disabled={!selectedRoutine || !targetDate || loading}
            className="w-full"
          >
            <Copy className="h-4 w-4 mr-1" />
            {loading ? 'Copiando...' : 'Copiar Rutina'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
