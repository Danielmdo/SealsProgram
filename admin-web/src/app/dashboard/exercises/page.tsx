'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Dumbbell } from 'lucide-react'
import { YouTubeEmbed } from '@/components/youtube-embed'

type CatalogExercise = {
  id: string
  name: string
  youtube_url: string | null
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<CatalogExercise[]>([])
  const [name, setName] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from('exercise_catalog').select('*').order('name')
    if (data) setExercises(data)
  }

  useEffect(() => { load() }, [])

  const add = async () => {
    if (!name.trim()) return
    setLoading(true)
    await supabase.from('exercise_catalog').insert({
      name: name.trim(),
      youtube_url: youtubeUrl.trim() || null,
    })
    setName('')
    setYoutubeUrl('')
    await load()
    setLoading(false)
  }

  const remove = async (id: string) => {
    await supabase.from('exercise_catalog').delete().eq('id', id)
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Dumbbell className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Catálogo de Ejercicios</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Agregar ejercicio</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del ejercicio" />
          <Input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="URL de YouTube (opcional)" />
          <Button onClick={add} disabled={loading || !name.trim()}>
            <Plus className="h-4 w-4 mr-2" /> Agregar
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {exercises.map(ex => (
          <Card key={ex.id} className="relative overflow-hidden">
            <Button
              variant="ghost" size="sm"
              onClick={() => remove(ex.id)}
              className="absolute top-2 right-2 h-8 w-8 p-0 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <CardHeader>
              <CardTitle className="text-base pr-8">{ex.name}</CardTitle>
            </CardHeader>
            {ex.youtube_url && (
              <CardContent>
                <YouTubeEmbed url={ex.youtube_url} />
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {exercises.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No hay ejercicios en el catálogo</p>
      )}
    </div>
  )
}
