'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { CalendarDays, Plus, Users, Star, Dumbbell } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Routine = {
  id: string
  date: string
  title: string
  notes: string | null
}

type Profile = {
  id: string
  name: string
  role: string
  super_admin: boolean
  trainer_id: string | null
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [trainer, setTrainer] = useState<Profile | null>(null)
  const [myUsers, setMyUsers] = useState<Profile[]>([])
  const [admins, setAdmins] = useState<Profile[]>([])
  const [todayRoutine, setTodayRoutine] = useState<Routine | null>(null)
  const [upcomingRoutines, setUpcomingRoutines] = useState<Routine[]>([])
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profile)
    setNewName(profile?.name || '')

    if (profile?.trainer_id) {
      const { data: t } = await supabase.from('profiles').select('*').eq('id', profile.trainer_id).single()
      setTrainer(t)
    }

    if (profile?.role === 'admin') {
      const { data: users } = await supabase.from('profiles').select('*').eq('trainer_id', user.id)
      setMyUsers(users || [])
    }

    if (profile?.role === 'user') {
      const { data: admins } = await supabase.from('profiles').select('*').eq('role', 'admin')
      setAdmins(admins || [])
    }

    const today = format(new Date(), 'yyyy-MM-dd')
    const { data: todayR } = await supabase.from('routines').select('*').eq('date', today).maybeSingle()
    setTodayRoutine(todayR)

    const { data: upcoming } = await supabase
      .from('routines').select('*').gte('date', today).order('date', { ascending: true }).limit(5)
    setUpcomingRoutines(upcoming || [])
  }

  const saveName = async () => {
    if (!profile) return
    await supabase.from('profiles').update({ name: newName }).eq('id', profile.id)
    setEditingName(false)
    loadData()
  }

  const selectTrainer = async (trainerId: string) => {
    if (!profile) return
    await supabase.from('profiles').update({ trainer_id: trainerId }).eq('id', profile.id)
    loadData()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <Dumbbell className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input value={newName} onChange={e => setNewName(e.target.value)} className="w-48 bg-secondary/50" />
                <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={saveName}>Guardar</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>Cancelar</Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{profile?.name || 'Bienvenido'}</h1>
                {profile?.role === 'admin' && (
                  <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-primary transition-colors text-sm">✎</button>
                )}
              </div>
            )}
            <p className="text-muted-foreground text-sm">
              {profile?.super_admin ? 'Super Administrador' : profile?.role === 'admin' ? 'Entrenador' : 'Atleta'}
            </p>
          </div>
        </div>
        {profile?.role === 'admin' && (
          <Link href="/dashboard/routines/new">
            <Button className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-1" />
              Nueva Rutina
            </Button>
          </Link>
        )}
      </div>

      {/* Trainer selection for users */}
      {profile?.role === 'user' && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Star className="h-4 w-4 text-primary" />
              Mi Entrenador
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trainer ? (
              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-orange-500/50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{trainer.name || 'Entrenador'}</p>
                  <p className="text-sm text-muted-foreground">Tu entrenador asignado</p>
                </div>
                <Button variant="outline" size="sm" className="border-border hover:border-primary/50" onClick={() => selectTrainer('')}>
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Selecciona tu entrenador:</p>
                <div className="flex flex-wrap gap-2">
                  {admins.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay entrenadores disponibles</p>
                  ) : (
                    admins.map(a => (
                      <Button key={a.id} variant="outline" size="sm" className="border-border hover:border-primary/50 hover:text-primary" onClick={() => selectTrainer(a.id)}>
                        {a.name || 'Entrenador'}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* My athletes (for trainers) */}
      {profile?.role === 'admin' && myUsers.length > 0 && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Mis Atletas ({myUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {myUsers.map(u => (
                <div key={u.id} className="px-4 py-2 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50">
                  {u.name || 'Sin nombre'}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Routines */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              Rutina de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayRoutine ? (
              <Link href={`/dashboard/routines/${todayRoutine.id}`}>
                <div className="p-4 bg-secondary/50 rounded-xl hover:bg-secondary/80 transition-all border border-border/50 hover:border-primary/30 group">
                  <p className="font-medium group-hover:text-primary transition-colors">{todayRoutine.title}</p>
                  {todayRoutine.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{todayRoutine.notes}</p>
                  )}
                </div>
              </Link>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No hay rutina para hoy</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Próximas Rutinas</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingRoutines.length > 0 ? (
              <div className="space-y-2">
                {upcomingRoutines.map(r => (
                  <Link key={r.id} href={`/dashboard/routines/${r.id}`}>
                    <div className="p-3 bg-secondary/50 rounded-xl hover:bg-secondary/80 transition-all border border-border/50 hover:border-primary/30 group">
                      <span className="font-medium text-sm group-hover:text-primary transition-colors">
                        {format(new Date(r.date), 'EEEE d MMM', { locale: es })}
                      </span>
                      <span className="text-muted-foreground text-sm ml-2">{r.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No hay rutinas próximas</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
