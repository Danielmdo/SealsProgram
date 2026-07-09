'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, X, Pencil, Plus, GripVertical } from 'lucide-react'
import Link from 'next/link'
import { YouTubeEmbed } from '@/components/youtube-embed'

type CatalogExercise = {
  id: string
  name: string
  youtube_url: string | null
}

type SectionExercise = {
  id?: string
  exercise_catalog_id: string
  exercise_name: string
  exercise_youtube?: string | null
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

type Routine = {
  id: string
  title: string
  notes: string
  date: string
}

export default function RoutineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [routine, setRoutine] = useState<Routine | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [catalog, setCatalog] = useState<CatalogExercise[]>([])
  const [canEdit, setCanEdit] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!params.id) return
    Promise.all([
      supabase.from('exercise_catalog').select('*').order('name'),
      supabase.auth.getUser().then(({ data: { user } }) =>
        supabase.from('profiles').select('role, super_admin').eq('id', user?.id).single()
      ),
    ]).then(([catResult, profileResult]) => {
      if (catResult.data) setCatalog(catResult.data)
      if (profileResult.data) setCanEdit(profileResult.data.role === 'admin' || profileResult.data.super_admin)

      supabase.from('routines').select('*').eq('id', params.id).single().then(({ data: r }) => {
        if (!r) return
        setRoutine(r)
        setEditTitle(r.title)
        setEditNotes(r.notes || '')
      })

      supabase.from('routine_sections').select('*').eq('routine_id', params.id).order('sort_order').then(async ({ data: secs }) => {
        if (!secs || secs.length === 0) return
        const sectionsWithExercises: Section[] = []
        for (const sec of secs) {
          const { data: exs } = await supabase
            .from('section_exercises')
            .select('*, exercise_catalog!inner(name, youtube_url)')
            .eq('section_id', sec.id)
            .order('sort_order')
          sectionsWithExercises.push({
            id: sec.id,
            title: sec.title,
            sort_order: sec.sort_order,
            value_label: sec.value_label || '',
            value: sec.value || '',
            exercises: (exs || []).map((e: any) => ({
              id: e.id,
              exercise_catalog_id: e.exercise_catalog_id,
              exercise_name: e.exercise_catalog?.name || '',
              exercise_youtube: e.exercise_catalog?.youtube_url || null,
              sort_order: e.sort_order,
              valor: e.valor || '',
              descripcion: e.descripcion || '',
            })),
          })
        }
        setSections(sectionsWithExercises)
      })
    })
  }, [params.id])

  const addExerciseToSection = (sectionIndex: number, catalogId: string) => {
    const ex = catalog.find(e => e.id === catalogId)
    if (!ex) return
    const updated = [...sections]
    updated[sectionIndex].exercises.push({
      exercise_catalog_id: ex.id,
      exercise_name: ex.name,
      exercise_youtube: ex.youtube_url,
      sort_order: updated[sectionIndex].exercises.length,
      valor: '',
      descripcion: '',
    })
    setSections(updated)
  }

  const updateSectionExercise = (sectionIndex: number, exerciseIndex: number, field: keyof SectionExercise, value: string) => {
    const updated = [...sections]
    ;(updated[sectionIndex].exercises[exerciseIndex] as any)[field] = value
    setSections(updated)
  }

  const removeSectionExercise = (sectionIndex: number, exerciseIndex: number) => {
    const updated = [...sections]
    updated[sectionIndex].exercises = updated[sectionIndex].exercises.filter((_, i) => i !== exerciseIndex)
    setSections(updated)
  }

  const addSection = () => {
    setSections([...sections, { title: '', sort_order: sections.length, value_label: '', value: '', exercises: [] }])
  }

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index).map((s, i) => ({ ...s, sort_order: i })))
  }

  const updateSection = (index: number, field: keyof Section, value: string | number) => {
    const updated = [...sections]
    updated[index] = { ...updated[index], [field]: value }
    setSections(updated)
  }

  const handleSave = async () => {
    if (!routine) return
    setSaving(true)
    await supabase.from('routines').update({ title: editTitle, notes: editNotes }).eq('id', routine.id)

    const existingSectionIds = sections.filter(s => s.id).map(s => s.id!)
    const { data: dbSections } = await supabase.from('routine_sections').select('id').eq('routine_id', routine.id)
    const toDeleteSections = (dbSections || []).filter(s => !existingSectionIds.includes(s.id)).map(s => s.id)
    if (toDeleteSections.length > 0) {
      await supabase.from('section_exercises').delete().in('section_id', toDeleteSections)
      await supabase.from('routine_sections').delete().in('id', toDeleteSections)
    }

    for (const section of sections) {
      if (section.id) {
        await supabase.from('routine_sections').update({
          title: section.title, sort_order: section.sort_order,
          value_label: section.value_label, value: section.value,
        }).eq('id', section.id)

        const existingExIds = section.exercises.filter(e => e.id).map(e => e.id!)
        const { data: dbExs } = await supabase.from('section_exercises').select('id').eq('section_id', section.id)
        const toDeleteExs = (dbExs || []).filter(e => !existingExIds.includes(e.id)).map(e => e.id)
        if (toDeleteExs.length > 0) await supabase.from('section_exercises').delete().in('id', toDeleteExs)

        for (const ex of section.exercises) {
          if (ex.id) {
            await supabase.from('section_exercises').update({
              valor: ex.valor, descripcion: ex.descripcion, sort_order: ex.sort_order,
            }).eq('id', ex.id)
          } else {
            await supabase.from('section_exercises').insert({
              section_id: section.id, exercise_catalog_id: ex.exercise_catalog_id,
              sort_order: ex.sort_order, valor: ex.valor, descripcion: ex.descripcion,
            })
          }
        }
      } else {
        const { data: sec } = await supabase.from('routine_sections').insert({
          routine_id: routine.id, title: section.title, sort_order: section.sort_order,
          value_label: section.value_label, value: section.value,
        }).select().single()
        if (sec) {
          for (const ex of section.exercises) {
            await supabase.from('section_exercises').insert({
              section_id: sec.id, exercise_catalog_id: ex.exercise_catalog_id,
              sort_order: ex.sort_order, valor: ex.valor, descripcion: ex.descripcion,
            })
          }
        }
      }
    }

    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!routine || !confirm('¿Eliminar esta rutina?')) return
    await supabase.from('routines').delete().eq('id', routine.id)
    router.push('/dashboard')
  }

  if (!routine) return <p className="text-center text-muted-foreground py-8">Cargando...</p>

  if (!editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" /> Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>Eliminar</Button>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold">{routine.title}</h1>
          <p className="text-sm text-muted-foreground">{routine.date}</p>
          {routine.notes && <p className="mt-2 text-sm">{routine.notes}</p>}
        </div>

        {sections.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Esta rutina no tiene secciones</p>
        )}

        {sections.map((section, si) => (
          <Card key={si}>
            <CardHeader>
              <CardTitle className="text-lg">
                {section.title}
                {(section.value_label || section.value) && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {section.value_label && <>{section.value_label}: </>}{section.value}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {section.exercises.map((ex, ei) => (
                <div key={ei} className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{ex.exercise_name}</p>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        {ex.valor && <span>{ex.valor}</span>}
                        {ex.descripcion && <span>{ex.descripcion}</span>}
                      </div>
                    </div>
                    {ex.exercise_youtube && (
                      <div className="w-48 shrink-0">
                        <YouTubeEmbed url={ex.exercise_youtube} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const availableExercises = (sectionIndex: number) => {
    const usedIds = sections[sectionIndex].exercises.map(e => e.exercise_catalog_id)
    return catalog.filter(e => !usedIds.includes(e.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setEditing(false)} className="flex items-center gap-2 text-sm">
          <ArrowLeft className="h-4 w-4" /> Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Información</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
          <Input value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notas" />
        </CardContent>
      </Card>

      {sections.map((section, si) => (
        <Card key={si}>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input value={section.title} onChange={e => updateSection(si, 'title', e.target.value)} placeholder="Nombre" className="font-semibold max-w-xs" />
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeSection(si)} className="h-8 w-8 p-0 text-destructive shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input value={section.value_label} onChange={e => updateSection(si, 'value_label', e.target.value)} placeholder="Etiqueta" className="max-w-xs" />
              <Input value={section.value} onChange={e => updateSection(si, 'value', e.target.value)} placeholder="Valor" className="max-w-xs" />
            </div>

            {section.exercises.map((ex, ei) => (
              <div key={ei} className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30">
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">{ex.exercise_name}</p>
                  <div className="flex gap-2">
                    <Input value={ex.valor} onChange={e => updateSectionExercise(si, ei, 'valor', e.target.value)} placeholder="Valor" className="text-sm" />
                    <Input value={ex.descripcion} onChange={e => updateSectionExercise(si, ei, 'descripcion', e.target.value)} placeholder="Descripción" className="text-sm" />
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeSectionExercise(si, ei)} className="h-8 w-8 p-0 text-destructive shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value=""
              onChange={e => { if (e.target.value) { addExerciseToSection(si, e.target.value); e.target.value = '' } }}
            >
              <option value="">Agregar ejercicio...</option>
              {availableExercises(si).map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addSection}>
        <Plus className="h-4 w-4 mr-2" /> Agregar sección
      </Button>
    </div>
  )
}
