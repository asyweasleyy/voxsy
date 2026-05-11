import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useJournal } from '../../hooks/useJournal';
import { useVideos } from '../../hooks/useVideos';
import { getUserInstruments, type Instrument } from '../../services/instruments.service';
import type { JournalItem, JournalItemType } from '../../services/journal.service';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#080810',
  surface: 'rgba(255,255,255,0.04)',
  surfaceRaised: 'rgba(255,255,255,0.07)',
  gold: '#C9A84C',
  goldMuted: 'rgba(201,168,76,0.55)',
  goldGlow: 'rgba(201,168,76,0.1)',
  goldBorder: 'rgba(201,168,76,0.3)',
  text: '#F0EBE3',
  textMuted: 'rgba(240,235,227,0.45)',
  textDim: 'rgba(240,235,227,0.22)',
  border: 'rgba(255,255,255,0.07)',
  green: '#4ADE80',
  greenDim: 'rgba(74,222,128,0.1)',
  purple: '#A78BFA',
  purpleDim: 'rgba(167,139,250,0.1)',
  danger: '#FF5A7E',
};

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

// ─── Date helpers ─────────────────────────────────────────────────────────────
const TR_MONTHS = [
  'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık',
];
const TR_DAYS = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateTR(d: Date): string {
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Section config ───────────────────────────────────────────────────────────
type SectionCfg = {
  type: JournalItemType;
  label: string;
  color: string;
  dim: string;
  icon: string;
};

const SECTIONS: SectionCfg[] = [
  { type: 'learned', label: 'Öğrendim',  color: C.green,  dim: C.greenDim,  icon: '✦' },
  { type: 'did',     label: 'Yaptım',    color: C.gold,   dim: C.goldGlow,  icon: '◆' },
  { type: 'todo',    label: 'Yapacağım', color: C.purple, dim: C.purpleDim, icon: '▲' },
];

// ─── SwipeRow ─────────────────────────────────────────────────────────────────
function SwipeRow({ onDelete, children }: { onDelete: () => void; children: React.ReactNode }) {
  const tx = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 8 && Math.abs(g.dy) < Math.abs(g.dx),
    onPanResponderMove: (_, g) => {
      if (g.dx < 0) {
        tx.setValue(Math.max(g.dx, -76));
        reveal.setValue(Math.min(-g.dx / 76, 1));
      }
    },
    onPanResponderRelease: (_, g) => {
      if (g.dx < -38) {
        Animated.spring(tx, { toValue: -76, useNativeDriver: true, tension: 140, friction: 8 }).start();
      } else {
        snapBack();
      }
    },
  });

  const snapBack = () => {
    Animated.parallel([
      Animated.spring(tx, { toValue: 0, useNativeDriver: true, tension: 130, friction: 9 }),
      Animated.timing(reveal, { toValue: 0, duration: 180, useNativeDriver: false }),
    ]).start();
  };

  return (
    <View style={{ overflow: 'hidden' }}>
      <Animated.View style={[sw.deleteZone, { opacity: reveal }]}>
        <Pressable
          style={sw.deleteBtn}
          onPress={() => { snapBack(); onDelete(); }}
        >
          <Text style={sw.deleteTxt}>Sil</Text>
        </Pressable>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX: tx }] }} {...pan.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const sw = StyleSheet.create({
  deleteZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,90,126,0.15)',
  },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.danger,
  },
  deleteTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

// ─── JournalItemRow ───────────────────────────────────────────────────────────
function JournalItemRow({
  item,
  color,
  onDelete,
  onUpdate,
}: {
  item: JournalItem;
  color: string;
  onDelete: () => void;
  onUpdate: (content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.content);

  const commit = () => {
    const t = draft.trim();
    if (t && t !== item.content) onUpdate(t);
    else setDraft(item.content);
    setEditing(false);
  };

  return (
    <SwipeRow onDelete={onDelete}>
      <View style={ir.row}>
        <View style={[ir.bullet, { backgroundColor: color }]} />
        {editing ? (
          <TextInput
            style={ir.input}
            value={draft}
            onChangeText={setDraft}
            onBlur={commit}
            onSubmitEditing={commit}
            autoFocus
            multiline
            selectionColor={color}
            returnKeyType="done"
          />
        ) : (
          <Pressable style={{ flex: 1 }} onPress={() => setEditing(true)}>
            <Text style={ir.text}>{item.content}</Text>
          </Pressable>
        )}
      </View>
    </SwipeRow>
  );
}

const ir = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    lineHeight: 22,
    letterSpacing: 0.15,
    opacity: 0.88,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    lineHeight: 22,
    letterSpacing: 0.15,
    padding: 0,
  },
});

// ─── JournalSection ───────────────────────────────────────────────────────────
function JournalSection({
  type, label, color, dim, icon, items, onAdd, onDelete, onUpdate,
}: SectionCfg & {
  items: JournalItem[];
  onAdd: (type: JournalItemType, content: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const chevronAnim = useRef(new Animated.Value(1)).current;

  const toggleCollapse = () => {
    Animated.timing(chevronAnim, {
      toValue: collapsed ? 1 : 0,
      duration: 210,
      useNativeDriver: true,
    }).start();
    setCollapsed(v => !v);
  };

  const submitAdd = () => {
    const t = newText.trim();
    if (t) onAdd(type, t);
    setNewText('');
    setAdding(false);
  };

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });

  return (
    <View style={[sec.wrap, { backgroundColor: dim }]}>
      {/* Header */}
      <Pressable style={sec.header} onPress={toggleCollapse}>
        <View style={sec.headerLeft}>
          <Text style={[sec.icon, { color }]}>{icon}</Text>
          <Text style={[sec.label, { color }]}>{label}</Text>
          <View style={[sec.badge, { backgroundColor: color }]}>
            <Text style={sec.badgeText}>{items.length}</Text>
          </View>
        </View>
        <Animated.Text style={[sec.chevron, { color, transform: [{ rotate: chevronRotate }] }]}>
          ›
        </Animated.Text>
      </Pressable>

      {/* Body */}
      {!collapsed && (
        <View style={sec.body}>
          {items.map(item => (
            <JournalItemRow
              key={item.id}
              item={item}
              color={color}
              onDelete={() => onDelete(item.id)}
              onUpdate={content => onUpdate(item.id, content)}
            />
          ))}

          {adding && (
            <View style={[ir.row, { backgroundColor: 'rgba(255,255,255,0.035)' }]}>
              <View style={[ir.bullet, { backgroundColor: color, opacity: 0.4 }]} />
              <TextInput
                style={ir.input}
                value={newText}
                onChangeText={setNewText}
                placeholder="Yaz ve Enter'a bas…"
                placeholderTextColor={C.textDim}
                onBlur={submitAdd}
                onSubmitEditing={submitAdd}
                autoFocus
                returnKeyType="done"
                selectionColor={color}
              />
            </View>
          )}

          <Pressable
            style={[sec.addBtn, { borderColor: color + '44' }]}
            onPress={() => setAdding(true)}
          >
            <Text style={[sec.addPlus, { color }]}>+</Text>
            <Text style={[sec.addLabel, { color }]}>Ekle</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const sec = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 10,
    fontWeight: '900',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#080810',
  },
  chevron: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '300',
  },
  body: {
    paddingBottom: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 9,
    alignSelf: 'flex-start',
  },
  addPlus: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 17,
  },
  addLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

// ─── VideoCard ────────────────────────────────────────────────────────────────
function VideoCard({
  title,
  onPlay,
  onDelete,
}: {
  title: string | null;
  onPlay: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable style={vc.card} onPress={onPlay}>
      <View style={vc.thumb}>
        <View style={vc.playBtn}>
          <Text style={vc.playIcon}>▶</Text>
        </View>
      </View>
      <View style={vc.footer}>
        <Text style={vc.title} numberOfLines={1}>{title || 'Video'}</Text>
        <Pressable style={vc.del} onPress={onDelete} hitSlop={8}>
          <Text style={vc.delText}>✕</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const vc = StyleSheet.create({
  card: {
    width: 120,
    backgroundColor: C.surfaceRaised,
    borderRadius: 11,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  thumb: {
    height: 76,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 10,
    color: '#080810',
    marginLeft: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 4,
  },
  title: {
    flex: 1,
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '500',
  },
  del: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,90,126,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delText: {
    fontSize: 8,
    color: C.danger,
    fontWeight: '700',
  },
});

// ─── BugunScreen ──────────────────────────────────────────────────────────────
const TODAY = new Date();
const TODAY_STR = toDateStr(TODAY);

export default function BugunScreen() {
  const { user, loading: authLoading } = useAuth();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [instLoading, setInstLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setInstLoading(true);
    getUserInstruments(user.id)
      .then(list => {
        setInstruments(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setInstLoading(false));
  }, [user?.id]);

  const { entry, loading: journalLoading, addJournalItem, updateJournalItem, deleteJournalItem } =
    useJournal({
      userId: user?.id ?? '',
      instrumentId: selectedId,
      date: TODAY_STR,
    });

  const { videos, add: addVideo, remove: removeVideo } = useVideos(entry?.id ?? '');

  const itemsOf = useCallback(
    (type: JournalItemType): JournalItem[] =>
      (entry?.items ?? [])
        .filter(i => i.type === type)
        .sort((a, b) => a.position - b.position),
    [entry],
  );

  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  // ── Loading / empty states ──────────────────────────────────────────────────
  if (authLoading || instLoading) {
    return (
      <View style={s.centered}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={s.centered}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <Text style={s.emptyTxt}>Oturum bulunamadı.</Text>
      </View>
    );
  }

  if (instruments.length === 0) {
    return (
      <View style={s.centered}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <Text style={s.bigIcon}>🎵</Text>
        <Text style={s.emptyHeading}>Enstrüman seçilmedi</Text>
        <Text style={s.emptyHint}>Profil ekranından enstrümanlarını ekleyebilirsin.</Text>
      </View>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Date + instrument tabs — sticky above scroll */}
      <View style={s.header}>
        {/* Date row */}
        <View style={s.dateRow}>
          <Text style={s.dateNum}>{TODAY.getDate()}</Text>
          <View style={s.dateMeta}>
            <Text style={s.dateWeekday}>{TR_DAYS[TODAY.getDay()]}</Text>
            <Text style={s.dateMonthYear}>
              {TR_MONTHS[TODAY.getMonth()]} {TODAY.getFullYear()}
            </Text>
          </View>
          {journalLoading && (
            <ActivityIndicator
              size="small"
              color={C.goldMuted}
              style={{ marginLeft: 'auto' }}
            />
          )}
        </View>

        {/* Instrument tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsWrap}
          style={s.tabsScroll}
        >
          {instruments.map(inst => {
            const active = inst.id === selectedId;
            return (
              <Pressable
                key={inst.id}
                style={[s.tab, active && s.tabActive]}
                onPress={() => setSelectedId(inst.id)}
              >
                <Text style={s.tabEmoji}>{inst.emoji}</Text>
                <Text style={[s.tabName, active && s.tabNameActive]}>{inst.name}</Text>
                {active && <View style={s.tabDot} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={s.divider} />

      {/* Scrollable body */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeIn }}>
            {/* Journal sections */}
            {SECTIONS.map(cfg => (
              <JournalSection
                key={cfg.type}
                {...cfg}
                items={itemsOf(cfg.type)}
                onAdd={addJournalItem}
                onDelete={deleteJournalItem}
                onUpdate={updateJournalItem}
              />
            ))}

            {/* Videos section */}
            <View style={s.videosWrap}>
              <View style={s.videosHeader}>
                <Text style={s.videosHeaderIcon}>▶</Text>
                <Text style={s.videosHeaderLabel}>Videolar</Text>
                {videos.length > 0 && (
                  <View style={s.videosBadge}>
                    <Text style={s.videosBadgeTxt}>{videos.length}</Text>
                  </View>
                )}
              </View>

              {videos.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.videosRow}
                >
                  {videos.map(v => (
                    <VideoCard
                      key={v.id}
                      title={v.title ?? null}
                      onPlay={() => { /* ASY-21: open full-screen player */ }}
                      onDelete={() => removeVideo(v.id)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <View style={s.videosEmpty}>
                  <Text style={s.videosEmptyTxt}>Henüz video eklenmedi</Text>
                </View>
              )}

              {/* Video add button — gallery picker wired in ASY-21 */}
              <Pressable
                style={s.videoAddBtn}
                onPress={() => {
                  // TODO: ASY-21 — expo-image-picker entegrasyonu
                  // const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'videos' });
                  // if (!result.canceled) await addVideo(result.assets[0].uri, undefined);
                }}
              >
                <Text style={s.videoAddIcon}>+</Text>
                <Text style={s.videoAddLabel}>Video Ekle</Text>
              </Pressable>
            </View>

            <View style={{ height: 48 }} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTxt: {
    color: C.textMuted,
    fontSize: 15,
  },
  bigIcon: {
    fontSize: 40,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyHeading: {
    fontSize: 18,
    color: C.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Header
  header: {
    paddingTop: 16,
    paddingBottom: 0,
    backgroundColor: C.bg,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 10,
  },
  dateNum: {
    fontFamily: SERIF,
    fontSize: 60,
    fontWeight: '700',
    color: C.text,
    lineHeight: 64,
    letterSpacing: -2,
  },
  dateMeta: {
    paddingBottom: 6,
    gap: 2,
  },
  dateWeekday: {
    fontSize: 18,
    fontWeight: '700',
    color: C.gold,
    letterSpacing: -0.3,
  },
  dateMonthYear: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Instrument tabs
  tabsScroll: {
    marginBottom: 0,
  },
  tabsWrap: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 14,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: C.goldGlow,
    borderColor: C.goldBorder,
  },
  tabEmoji: {
    fontSize: 16,
  },
  tabName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
    letterSpacing: 0.1,
  },
  tabNameActive: {
    color: C.gold,
  },
  tabDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.gold,
    marginLeft: 2,
  },

  divider: {
    height: 1,
    backgroundColor: C.border,
  },

  // Scroll body
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Videos section
  videosWrap: {
    marginTop: 6,
  },
  videosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  videosHeaderIcon: {
    fontSize: 9,
    color: C.goldMuted,
    fontWeight: '900',
  },
  videosHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: C.textDim,
  },
  videosBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  videosBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: C.gold,
  },
  videosRow: {
    gap: 10,
    marginBottom: 12,
  },
  videosEmpty: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.border,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  videosEmptyTxt: {
    fontSize: 13,
    color: C.textDim,
  },
  videoAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.goldBorder,
    alignSelf: 'flex-start',
  },
  videoAddIcon: {
    fontSize: 16,
    color: C.gold,
    fontWeight: '600',
    lineHeight: 18,
  },
  videoAddLabel: {
    fontSize: 13,
    color: C.gold,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
