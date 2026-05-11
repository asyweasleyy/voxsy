import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useJournal } from '../../hooks/useJournal';
import { useVideos } from '../../hooks/useVideos';
import { getUserInstruments, type Instrument } from '../../services/instruments.service';
import type { JournalItem, JournalItemType } from '../../services/journal.service';
import type { JournalVideo } from '../../services/video.service';

const TODAY = new Date().toISOString().split('T')[0];

const DAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const SECTIONS: { type: JournalItemType; label: string; bgColor: string; accent: string }[] = [
  { type: 'learned', label: 'Öğrendim', bgColor: '#0D2219', accent: '#34D399' },
  { type: 'did',     label: 'Yaptım',   bgColor: '#1E1507', accent: '#F5A623' },
  { type: 'todo',    label: 'Yapacağım', bgColor: '#120D2A', accent: '#A78BFA' },
];

// ─── SwipableItem ─────────────────────────────────────────────────────────────

interface SwipableItemProps {
  item: JournalItem;
  accent: string;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
}

function SwipableItem({ item, accent, onDelete, onEdit }: SwipableItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.content);
  const isRevealed = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dy) < Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          translateX.setValue(Math.max(g.dx + (isRevealed.current ? -80 : 0), -80));
        } else if (isRevealed.current) {
          translateX.setValue(Math.min(g.dx - 80, 0));
        }
      },
      onPanResponderRelease: (_, g) => {
        const finalDx = isRevealed.current ? g.dx - 80 : g.dx;
        if (finalDx < -40) {
          Animated.spring(translateX, { toValue: -80, useNativeDriver: true }).start();
          isRevealed.current = true;
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          isRevealed.current = false;
        }
      },
    }),
  ).current;

  const closeSwipe = useCallback(() => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    isRevealed.current = false;
  }, [translateX]);

  const handleLongPress = useCallback(() => {
    closeSwipe();
    Alert.alert('Maddeyi Sil', `"${item.content}" silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => onDelete(item.id) },
    ]);
  }, [item, onDelete, closeSwipe]);

  const commitEdit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== item.content) {
      onEdit(item.id, trimmed);
    }
    setEditing(false);
  }, [draft, item, onEdit]);

  return (
    <View style={s.swipeRow}>
      <View style={s.deleteSlot}>
        <Pressable
          style={s.deleteBtn}
          onPress={() => onDelete(item.id)}
          accessibilityLabel="Sil"
          accessibilityRole="button"
        >
          <Text style={s.deleteBtnText}>Sil</Text>
        </Pressable>
      </View>

      <Animated.View
        style={[s.itemRow, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <View style={[s.itemDot, { backgroundColor: accent }]} />
        {editing ? (
          <TextInput
            style={s.itemEditInput}
            value={draft}
            onChangeText={setDraft}
            onBlur={commitEdit}
            onSubmitEditing={commitEdit}
            returnKeyType="done"
            autoFocus
            selectionColor={accent}
          />
        ) : (
          <Pressable
            style={{ flex: 1 }}
            onPress={() => { closeSwipe(); setEditing(true); }}
            onLongPress={handleLongPress}
            delayLongPress={500}
            accessibilityHint="Uzun basarak sil"
          >
            <Text style={s.itemText}>{item.content}</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

// ─── JournalSection ───────────────────────────────────────────────────────────

interface JournalSectionProps {
  type: JournalItemType;
  label: string;
  bgColor: string;
  accent: string;
  items: JournalItem[];
  onAdd: (content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, content: string) => Promise<void>;
}

function JournalSection({ label, bgColor, accent, items, onAdd, onDelete, onEdit }: JournalSectionProps) {
  const [showInput, setShowInput] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = useCallback(async () => {
    const content = draft.trim();
    if (!content) { setShowInput(false); return; }
    setSaving(true);
    try {
      await onAdd(content);
      setDraft('');
      setShowInput(false);
    } catch {
      // error already stored in hook
    } finally {
      setSaving(false);
    }
  }, [draft, onAdd]);

  const handleBlur = useCallback(() => {
    if (!draft.trim()) setShowInput(false);
  }, [draft]);

  return (
    <View style={[s.section, { backgroundColor: bgColor }]}>
      <View style={s.sectionHead}>
        <Text style={[s.sectionLabel, { color: accent }]}>{label}</Text>
        <View style={[s.badge, { backgroundColor: accent + '28' }]}>
          <Text style={[s.badgeText, { color: accent }]}>{items.length}</Text>
        </View>
        <Pressable
          style={[s.plusBtn, { borderColor: accent + '70' }]}
          onPress={() => setShowInput(v => !v)}
          accessibilityLabel={`${label} bölümüne madde ekle`}
          accessibilityRole="button"
        >
          <Text style={[s.plusBtnText, { color: accent }]}>+</Text>
        </Pressable>
      </View>

      {items.map(item => (
        <SwipableItem
          key={item.id}
          item={item}
          accent={accent}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}

      {showInput && (
        <View style={s.inlineRow}>
          <View style={[s.itemDot, { backgroundColor: accent }]} />
          <TextInput
            style={[s.inlineInput, { borderBottomColor: accent + '60' }]}
            placeholder="Yeni madde…"
            placeholderTextColor="#4A5568"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={handleAdd}
            onBlur={handleBlur}
            returnKeyType="done"
            autoFocus
            editable={!saving}
            selectionColor={accent}
          />
          <Pressable
            style={s.addBtn}
            onPress={handleAdd}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Ekle"
          >
            <Text style={[s.addBtnText, { color: accent }]}>
              {saving ? '…' : 'Ekle'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── VideosSection ────────────────────────────────────────────────────────────

interface VideosSectionProps {
  videos: JournalVideo[];
  onAddPress: () => void;
}

function VideosSection({ videos, onAddPress }: VideosSectionProps) {
  return (
    <View style={s.videosSection}>
      <View style={s.sectionHead}>
        <Text style={[s.sectionLabel, { color: '#94A3B8' }]}>Videolar</Text>
        <Pressable
          style={s.videoAddBtn}
          onPress={onAddPress}
          accessibilityRole="button"
          accessibilityLabel="Video ekle"
        >
          <Text style={s.videoAddBtnText}>+ Video Ekle</Text>
        </Pressable>
      </View>

      {videos.length === 0 ? (
        <View style={s.emptyVideos}>
          <Text style={s.emptyVideoIcon}>▶</Text>
          <Text style={s.emptyVideoText}>Henüz video yok</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {videos.map(v => (
            <View key={v.id} style={s.videoThumb}>
              <View style={s.playCircle}>
                <Text style={s.playIcon}>▶</Text>
              </View>
              {v.title ? (
                <Text style={s.videoTitle} numberOfLines={1}>{v.title}</Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── BugunScreen ──────────────────────────────────────────────────────────────

export default function BugunScreen() {
  const { width } = useWindowDimensions();
  const { user, loading: authLoading } = useAuth();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [instrumentsLoading, setInstrumentsLoading] = useState(true);

  const userId = user?.id ?? '';
  const instrumentId = selectedInstrument?.id ?? '';

  const {
    entry,
    loading: journalLoading,
    addJournalItem,
    updateJournalItem,
    deleteJournalItem,
  } = useJournal({ userId, instrumentId, date: TODAY });

  const { videos, add: addVideo } = useVideos(entry?.id ?? '');

  useEffect(() => {
    if (!userId) return;
    getUserInstruments(userId)
      .then(data => {
        setInstruments(data);
        if (data.length > 0) setSelectedInstrument(data[0]);
      })
      .catch(() => {})
      .finally(() => setInstrumentsLoading(false));
  }, [userId]);

  const now = new Date();
  const dateNumSize = Math.min(width * 0.18, 80);

  if (authLoading) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator color="#F5A623" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={[s.dateNum, { fontSize: dateNumSize, lineHeight: dateNumSize * 1.1 }]}>
          {now.getDate()}
        </Text>
        <View style={s.dateMeta}>
          <Text style={s.dayName}>{DAYS_TR[now.getDay()]}</Text>
          <Text style={s.monthYear}>
            {MONTHS_TR[now.getMonth()]} {now.getFullYear()}
          </Text>
        </View>
        <View style={s.waveDecor}>
          {[0, 6, 12, 18, 12, 6, 0].map((h, i) => (
            <View
              key={i}
              style={[s.waveBit, { height: 4 + h, opacity: 0.15 + h * 0.02 }]}
            />
          ))}
        </View>
      </View>

      {instrumentsLoading ? (
        <ActivityIndicator color="#F5A623" style={{ marginBottom: 8 }} />
      ) : instruments.length === 0 ? (
        <View style={s.noInstrBanner}>
          <Text style={s.noInstrText}>Profil'den enstrüman ekle</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.instrScroll}
          contentContainerStyle={s.instrScrollContent}
        >
          {instruments.map(inst => {
            const sel = inst.id === selectedInstrument?.id;
            return (
              <Pressable
                key={inst.id}
                onPress={() => setSelectedInstrument(inst)}
                style={[s.instrChip, sel && s.instrChipSel]}
                accessibilityRole="tab"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={inst.name}
              >
                <Text style={s.instrEmoji}>{inst.emoji}</Text>
                <Text style={[s.instrName, sel && s.instrNameSel]}>{inst.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {selectedInstrument ? (
        <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
          {journalLoading ? (
            <ActivityIndicator color="#F5A623" style={{ marginTop: 40 }} />
          ) : (
            <>
              {SECTIONS.map(sec => (
                <JournalSection
                  key={sec.type}
                  type={sec.type}
                  label={sec.label}
                  bgColor={sec.bgColor}
                  accent={sec.accent}
                  items={(entry?.items ?? []).filter(i => i.type === sec.type)}
                  onAdd={content => addJournalItem(sec.type, content)}
                  onDelete={deleteJournalItem}
                  onEdit={updateJournalItem}
                />
              ))}

              <VideosSection
                videos={videos}
                onAddPress={() =>
                  Alert.alert('Yakında', 'Video ekleme özelliği ASY-21 ile eklenecek.')
                }
              />

              <View style={{ height: 40 }} />
            </>
          )}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 14,
  },
  dateNum: {
    fontWeight: '800',
    color: '#F5A623',
  },
  dateMeta: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  monthYear: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  waveDecor: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  waveBit: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#F5A623',
  },

  // Instrument tabs
  instrScroll: {
    maxHeight: 52,
    marginBottom: 10,
  },
  instrScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  instrChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: '#141420',
    borderWidth: 1,
    borderColor: '#252535',
  },
  instrChipSel: {
    backgroundColor: '#231900',
    borderColor: '#F5A623',
  },
  instrEmoji: {
    fontSize: 15,
  },
  instrName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  instrNameSel: {
    color: '#F5A623',
    fontWeight: '700',
  },
  noInstrBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 10,
    backgroundColor: '#141420',
    borderRadius: 10,
    alignItems: 'center',
  },
  noInstrText: {
    color: '#64748B',
    fontSize: 13,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Section
  section: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.3,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  plusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBtnText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    marginTop: -1,
  },

  // Swipable item
  swipeRow: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 2,
  },
  deleteSlot: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  deleteBtn: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 10,
    backgroundColor: 'transparent',
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  itemText: {
    fontSize: 14,
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 20,
  },
  itemEditInput: {
    flex: 1,
    fontSize: 14,
    color: '#E2E8F0',
    padding: 0,
    lineHeight: 20,
  },

  // Inline add input
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  inlineInput: {
    flex: 1,
    fontSize: 14,
    color: '#E2E8F0',
    padding: 0,
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  addBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Videos section
  videosSection: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#0E0E18',
    borderWidth: 1,
    borderColor: '#1C1C2E',
  },
  videoAddBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#1A1A2C',
  },
  videoAddBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  emptyVideos: {
    alignItems: 'center',
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: '#1E1E30',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 4,
    gap: 8,
  },
  emptyVideoIcon: {
    fontSize: 22,
    color: '#252535',
  },
  emptyVideoText: {
    color: '#374151',
    fontSize: 13,
  },
  videoThumb: {
    width: 120,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#141424',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  playCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5A623',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 13,
    color: '#0A0A0F',
    marginLeft: 2,
  },
  videoTitle: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    fontSize: 10,
    color: '#E2E8F0',
    fontWeight: '600',
  },
});
