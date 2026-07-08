'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CalendarDays, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Routine = {
  id: string
  date: string
  title: string
  notes: string | null
}

type Profile = {
  name: string
  role: string
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [todayRoutine, setTodayRoutine] = useState<Routine | null>(null)
  const [upcomingRoutines, setUpcomingRoutines] = useState<Routine[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .single()
    setProfile(profile)

    const today = format(new Date(), 'yyyy-MM-dd')
    const { data: todayR } = await supabase
      .from('routines')
      .select('*')
      .eq('date', today)
      .maybeSingle()
    setTodayRoutine(todayR)

    const { data: upcoming } = await supabase
      .from('routines')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(5)
    setUpcomingRoutines(upcoming || [])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {profile ? `Bienvenido, ${profile.name}` : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {profile?.role === 'admin' ? 'Administrador' : 'Usuario'}
          </p>
        </div>
        {profile?.role === 'admin' && (
          <Link href="/dashboard/routines/new">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Nueva Rutina
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Rutina de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayRoutine ? (
              <Link href={`/dashboard/routines/${todayRoutine.id}`}>
                <div className="p-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors">
                  <p className="font-medium">{todayRoutine.title}</p>
                  {todayRoutine.notes && (
                    <p className="text-sm text-muted-foreground">{todayRoutine.notes}</p>
                  )}
                </div>
              </Link>
            ) : (
              <p className="text-muted-foreground text-sm">No hay rutina asignada para hoy</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Próximas Rutinas</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingRoutines.length > 0 ? (
              <div className="space-y-2">
                {upcomingRoutines.map(r => (
                  <Link key={r.id} href={`/dashboard/routines/${r.id}`}>
                    <div className="p-2.5 bg-accent rounded-lg hover:bg-accent/80 transition-colors text-sm">
                      <span className="font-medium">
                        {format(new Date(r.date), 'EEEE d MMM', { locale: es })}
                      </span>
                      <span className="text-muted-foreground ml-2">{r.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No hay rutinas próximas</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
