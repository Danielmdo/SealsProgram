import { useEffect, useState } from 'react'
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { YouTubePlayer } from '../components/YouTubePlayer'
import type { Routine, RoutineSection } from '../lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Props = {
  routineId: string
  onBack: () => void
}

export function RoutineDetailScreen({ routineId, onBack }: Props) {
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [sections, setSections] = useState<RoutineSection[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    loadRoutine()
  }, [routineId])

  async function loadRoutine() {
    const { data: r } = await supabase
      .from('routines')
      .select('*')
      .eq('id', routineId)
      .single()
    setRoutine(r)

    const { data: secs } = await supabase
      .from('routine_sections')
      .select('*, section_exercises(*, exercise_catalog(*))')
      .eq('routine_id', routineId)
      .order('sort_order', { ascending: true })
    setSections(secs || [])
  }

  const sectionData = sections.map(sec => ({
    title: sec.title,
    valueLabel: sec.value_label,
    value: sec.value,
    data: sec.section_exercises || [],
  }))

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sectionData}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={() => (
          <View style={styles.routineInfo}>
            <Text style={styles.routineTitle}>{routine?.title}</Text>
            {routine?.date && (
              <Text style={styles.routineDate}>
                {format(new Date(routine.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </Text>
            )}
            {routine?.notes && (
              <Text style={styles.routineNotes}>{routine.notes}</Text>
            )}
            <Text style={styles.exercisesCount}>
              {sections.length} seccion{sections.length !== 1 ? 'es' : ''}
            </Text>
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {(section.valueLabel || section.value) && (
              <Text style={styles.sectionValue}>
                {section.valueLabel && <>{section.valueLabel}: </>}{section.value}
              </Text>
            )}
          </View>
        )}
        renderItem={({ item, index }) => (
          <View style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>
                {item.exercise_catalog?.name || 'Ejercicio'}
              </Text>
            </View>

            {(item.valor || item.descripcion) && (
              <View style={styles.exerciseDetails}>
                {item.valor ? (
                  <View style={styles.detailBadge}>
                    <Text style={styles.detailText}>{item.valor}</Text>
                  </View>
                ) : null}
                {item.descripcion ? (
                  <View style={styles.detailBadge}>
                    <Text style={styles.detailText}>{item.descripcion}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {item.exercise_catalog?.youtube_url && (
              <TouchableOpacity
                style={styles.videoBtn}
                onPress={() => setVideoUrl(item.exercise_catalog!.youtube_url!)}
              >
                <Text style={styles.videoBtnText}>▶ Ver video</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <Text style={styles.emptyExercises}>Sin ejercicios</Text>
          ) : null
        }
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No hay secciones en esta rutina</Text>
        )}
      />

      <Modal visible={!!videoUrl} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setVideoUrl(null)}
            >
              <Text style={styles.closeText}>Cerrar ✕</Text>
            </TouchableOpacity>
            {videoUrl && <YouTubePlayer url={videoUrl} />}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#171717',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  backBtn: {
    paddingVertical: 4,
  },
  backText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '500',
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  routineInfo: {
    marginBottom: 24,
  },
  routineTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fafafa',
  },
  routineDate: {
    fontSize: 14,
    color: '#a3a3a3',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  routineNotes: {
    fontSize: 14,
    color: '#a3a3a3',
    marginTop: 12,
    fontStyle: 'italic',
  },
  exercisesCount: {
    fontSize: 13,
    color: '#dc2626',
    marginTop: 12,
    fontWeight: '500',
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
    paddingLeft: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fafafa',
  },
  sectionValue: {
    fontSize: 13,
    color: '#a3a3a3',
    marginTop: 2,
  },
  exerciseCard: {
    backgroundColor: '#171717',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#262626',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fafafa',
    flex: 1,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  detailBadge: {
    backgroundColor: '#262626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#a3a3a3',
  },
  videoBtn: {
    marginTop: 10,
    backgroundColor: '#dc262615',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc262630',
  },
  videoBtnText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000CC',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#171717',
    borderRadius: 16,
    overflow: 'hidden',
  },
  closeBtn: {
    padding: 14,
    alignItems: 'flex-end',
  },
  closeText: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyExercises: {
    color: '#666',
    fontSize: 13,
    fontStyle: 'italic',
    paddingLeft: 4,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 40,
  },
})
