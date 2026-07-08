import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { supabase } from '../lib/supabase'
import type { Routine, Profile } from '../lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Props = {
  onNavigateToRoutine: (routineId: string) => void
  onLogout: () => void
}

export function HomeScreen({ onNavigateToRoutine, onLogout }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [trainer, setTrainer] = useState<Profile | null>(null)
  const [admins, setAdmins] = useState<Profile[]>([])
  const [todayRoutine, setTodayRoutine] = useState<Routine | null>(null)
  const [upcomingRoutines, setUpcomingRoutines] = useState<Routine[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(profile)

    // Cargar entrenador asignado
    if (profile?.trainer_id) {
      const { data: t } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', profile.trainer_id)
        .single()
      setTrainer(t)
    }

    // Cargar entrenadores disponibles
    if (profile?.role === 'user' && !profile?.trainer_id) {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'admin')
      setAdmins(admins || [])
    }

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

  const selectTrainer = async (trainerId: string) => {
    if (!profile) return
    await supabase.from('profiles').update({ trainer_id: trainerId }).eq('id', profile.id)
    loadData()
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hola, {profile?.name || 'Atleta'}
          </Text>
          <Text style={styles.subtitle}>
            {profile?.super_admin
              ? 'Super Admin'
              : profile?.role === 'admin'
              ? 'Entrenador'
              : 'Atleta'}
          </Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={upcomingRoutines}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc2626" />
        }
        ListHeaderComponent={() => (
          <>
            {/* Info del entrenador */}
            {profile?.role === 'user' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mi Entrenador</Text>
                {trainer ? (
                  <View style={styles.trainerCard}>
                    <Text style={styles.trainerName}>{trainer.name || 'Entrenador'}</Text>
                    <Text style={styles.trainerLabel}>Tu entrenador asignado</Text>
                  </View>
                ) : (
                  <View style={styles.trainerCard}>
                    <Text style={styles.chooseLabel}>Selecciona tu entrenador:</Text>
                    <View style={styles.trainerList}>
                      {admins.length === 0 ? (
                        <Text style={styles.emptyText}>No hay entrenadores disponibles</Text>
                      ) : (
                        admins.map(a => (
                          <TouchableOpacity
                            key={a.id}
                            style={styles.trainerOption}
                            onPress={() => selectTrainer(a.id)}
                          >
                            <Text style={styles.trainerOptionText}>{a.name || 'Entrenador'}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rutina de Hoy</Text>
              {todayRoutine ? (
                <TouchableOpacity
                  style={styles.routineCard}
                  onPress={() => onNavigateToRoutine(todayRoutine.id)}
                >
                  <Text style={styles.routineTitle}>{todayRoutine.title}</Text>
                  {todayRoutine.notes && (
                    <Text style={styles.routineNotes}>{todayRoutine.notes}</Text>
                  )}
                  <Text style={styles.routineCTA}>Ver ejercicios →</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.emptyText}>No hay rutina para hoy</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Próximas Rutinas</Text>
              {upcomingRoutines.length === 0 && (
                <Text style={styles.emptyText}>No hay rutinas próximas</Text>
              )}
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.upcomingCard}
            onPress={() => onNavigateToRoutine(item.id)}
          >
            <Text style={styles.upcomingDate}>
              {format(new Date(item.date), "EEEE d 'de' MMMM", { locale: es })}
            </Text>
            <Text style={styles.upcomingTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#171717',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fafafa',
  },
  subtitle: {
    fontSize: 14,
    color: '#a3a3a3',
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#262626',
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '500',
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fafafa',
    marginBottom: 12,
  },
  trainerCard: {
    backgroundColor: '#171717',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eab30830',
  },
  trainerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fafafa',
  },
  trainerLabel: {
    fontSize: 13,
    color: '#a3a3a3',
    marginTop: 2,
  },
  chooseLabel: {
    fontSize: 14,
    color: '#a3a3a3',
    marginBottom: 10,
  },
  trainerList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trainerOption: {
    backgroundColor: '#262626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc262630',
  },
  trainerOptionText: {
    color: '#dc2626',
    fontWeight: '500',
    fontSize: 14,
  },
  routineCard: {
    backgroundColor: '#171717',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dc262630',
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fafafa',
  },
  routineNotes: {
    fontSize: 14,
    color: '#a3a3a3',
    marginTop: 4,
  },
  routineCTA: {
    fontSize: 14,
    color: '#dc2626',
    marginTop: 8,
    fontWeight: '500',
  },
  upcomingCard: {
    backgroundColor: '#171717',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 10,
    padding: 14,
  },
  upcomingDate: {
    fontSize: 12,
    color: '#a3a3a3',
    textTransform: 'capitalize',
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fafafa',
    marginTop: 2,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
})
