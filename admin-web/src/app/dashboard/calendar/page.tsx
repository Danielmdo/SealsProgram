'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'

type Routine = {
  id: string
  date: string
  title: string
}

export default function CalendarPage() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [month, setMonth] = useState<Date>(new Date())
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
    loadRoutines()
  }, [month])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    setProfile(data)
  }

  async function loadRoutines() {
    const start = new Date(month.getFullYear(), month.getMonth(), 1)
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)

    const { data } = await supabase
      .from('routines')
      .select('id, date, title')
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(end, 'yyyy-MM-dd'))
      .order('date', { ascending: true })

    setRoutines(data || [])
  }

  const routineDates = routines.map(r => r.date)
  const selectedRoutines = routines.filter(r => r.date === format(selectedDate, 'yyyy-MM-dd'))

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendario de Rutinas</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[400px_1fr]">
        <Card>
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              month={month}
              onMonthChange={setMonth}
              modifiers={{
                hasRoutine: (date) => routineDates.includes(format(date, 'yyyy-MM-dd')),
              }}
              modifiersStyles={{
                hasRoutine: { fontWeight: 'bold', color: 'var(--primary)' },
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </CardTitle>
            {isAdmin && (
              <Link href={`/dashboard/routines/new`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {selectedRoutines.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No hay rutinas para este día
              </p>
            ) : (
              <div className="space-y-2">
                {selectedRoutines.map(r => (
                  <Link key={r.id} href={`/dashboard/routines/${r.id}`}>
                    <div className="p-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors">
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
