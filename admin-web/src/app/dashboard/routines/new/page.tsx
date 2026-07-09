'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, ArrowLeft, Save, X, GripVertical } from 'lucide-react'
import Link from 'next/link'
import { getYouTubeId } from '@/lib/utils'

type CatalogExercise = {
  id: string
  name: string
  youtube_url: string | null
}

type SectionExercise = {
  id?: string
  exercise_catalog_id: string
  exercise_name: string
  sort_order: number
  valor: string
  descripcion: string
}

type Section = {
  id?: string
  title: string
  sort_order: number
  value_label: string
  value: string
  exercises: SectionExercise[]
}

const DEFAULT_SECTIONS: Section[] = [
  { title: 'Warm Up', sort_order: 0, value_label: '', value: '', exercises: [] },
  { title: 'Power Lifting', sort_order: 1, value_label: '', value: '', exercises: [] },
  { title: 'Accesorios', sort_order: 2, value_label: '', value: '', exercises: [] },
  { title: 'WOD', sort_order: 3, value_label: '', value: '', exercises: [] },
  { title: 'Gymnacio', sort_order: 4, value_label: '', value: '', exercises: [] },
]

const SECTION_PRESETS = ['Warm Up', 'Power Lifting', 'Accesorios', 'WOD', 'Gymnacio']

export default function NewRoutinePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [title, setTitle] = useState('Rutina del día')
  const [notes, setNotes] = useState('')
  const [sections, setSections] = useState<Section[]>(JSON.parse(JSON.stringify(DEFAULT_SECTIONS)))
  const [catalog, setCatalog] = useState<CatalogExercise[]>([])
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('exercise_catalog').select('*').order('name').then(({ data }) => {
      if (data) setCatalog(data)
    })
  }, [])

  const updateSection = (index: number, field: keyof Section, value: string | number) => {
    const updated = [...sections]
    updated[index] = { ...updated[index], [field]: value }
    setSections(updated)
  }

  const addSection = () => {
    setSections([...sections, { title: '', sort_order: sections.length, value_label: '', value: '', exercises: [] }])
  }

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index).map((s, i) => ({ ...s, sort_order: i })))
  }

  const addExerciseToSection = (sectionIndex: number, catalogId: string) => {
    const ex = catalog.find(e => e.id === catalogId)
    if (!ex) return
    const updated = [...sections]
    updated[sectionIndex].exercises.push({
      exercise_catalog_id: ex.id,
      exercise_name: ex.name,
      sort_order: updated[sectionIndex].exercises.length,
      valor: '',
      descripcion: '',
    })
    setSections(updated)
  }

  const updateSectionExercise = (sectionIndex: number, exerciseIndex: number, field: keyof SectionExercise, value: string) => {
    const updated = [...sections]
    updated[sectionIndex].exercises[exerciseIndex] = { ...updated[sectionIndex].exercises[exerciseIndex], [field]: value }
    setSections(updated)
  }

  const removeSectionExercise = (sectionIndex: number, exerciseIndex: number) => {
    const updated = [...sections]
    updated[sectionIndex].exercises = updated[sectionIndex].exercises.filter((_, i) => i !== exerciseIndex)
    setSections(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: routine, error: routineError } = await supabase.from('routines').insert({
      title,
      notes,
      date,
      created_by: user.id,
    }).select().single()

    if (routineError || !routine) { setSaving(false); return }

    for (const section of sections) {
      const { data: sec } = await supabase.from('routine_sections').insert({
        routine_id: routine.id,
        title: section.title,
        sort_order: section.sort_order,
        value_label: section.value_label,
        value: section.value,
      }).select().single()

      if (!sec) continue

      for (const ex of section.exercises) {
        await supabase.from('section_exercises').insert({
          section_id: sec.id,
          exercise_catalog_id: ex.exercise_catalog_id,
          sort_order: ex.sort_order,
          valor: ex.valor,
          descripcion: ex.descripcion,
        })
      }
    }

    setSaving(false)
    router.push('/dashboard')
  }

  const availableExercises = (sectionIndex: number) => {
    const usedIds = sections[sectionIndex].exercises.map(e => e.exercise_catalog_id)
    return catalog.filter(e => !usedIds.includes(e.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Información de la rutina</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" />
          <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas generales (opcional)" />
        </CardContent>
      </Card>

      {sections.map((section, si) => (
        <Card key={si} className="relative">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={section.title}
                onChange={e => updateSection(si, 'title', e.target.value)}
                placeholder="Nombre de la sección"
                list="section-presets"
                className="font-semibold text-base max-w-xs"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeSection(si)} className="h-8 w-8 p-0 text-destructive shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                value={section.value_label}
                onChange={e => updateSection(si, 'value_label', e.target.value)}
                placeholder="Etiqueta (ej: Tiempo, Rondas)"
                className="max-w-xs"
              />
              <Input
                value={section.value}
                onChange={e => updateSection(si, 'value', e.target.value)}
                placeholder="Valor (ej: 10 min, 3 rounds)"
                className="max-w-xs"
              />
            </div>

            {section.exercises.map((ex, ei) => (
              <div key={ei} className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30">
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">{ex.exercise_name}</p>
                  <div className="flex gap-2">
                    <Input
                      value={ex.valor}
                      onChange={e => updateSectionExercise(si, ei, 'valor', e.target.value)}
                      placeholder="Valor (ej: 5km, 100cal, 20 reps)"
                      className="text-sm"
                    />
                    <Input
                      value={ex.descripcion}
                      onChange={e => updateSectionExercise(si, ei, 'descripcion', e.target.value)}
                      placeholder="Descripción (ej: RX 50kg)"
                      className="text-sm"
                    />
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeSectionExercise(si, ei)} className="h-8 w-8 p-0 text-destructive shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="flex gap-2">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value=""
                onChange={e => { if (e.target.value) { addExerciseToSection(si, e.target.value); e.target.value = '' } }}
              >
                <option value="">Agregar ejercicio del catálogo...</option>
                {availableExercises(si).map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      ))}

      <datalist id="section-presets">
        {SECTION_PRESETS.map(p => <option key={p} value={p} />)
        }
      </datalist>

      <div className="flex gap-3">
        <Button variant="outline" onClick={addSection}>
          <Plus className="h-4 w-4 mr-2" /> Agregar sección
        </Button>
      </div>
    </div>
  )
}
