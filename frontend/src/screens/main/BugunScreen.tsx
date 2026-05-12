import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
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
import { VideoPlayerModal } from '../../components/VideoPlayerModal';
import { VideoThumbnailCard } from '../../components/VideoThumbnailCard';
import { useAuth } from '../../hooks/useAuth';
import { useJournal } from '../../hooks/useJournal';
import { useVideos } from '../../hooks/useVideos';
import { getUserInstruments, type Instrument } from '../../services/instruments.service';
import type { JournalItem, JournalItemType } from '../../services/journal.service';
import type { JournalVideo } from '../../services/video.service';

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

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TR_DAYS = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type SectionCfg = { type: JournalItemType; label: string; color: string; dim: string; icon: string };

const SECTIONS: SectionCfg[] = [
  { type: 'learned', label: 'Öğrendim',  color: C.green,  dim: C.greenDim,  icon: '✦' },
  { type: 'did',     label: 'Yaptım',    color: C.gold,   dim: C.goldGlow,  icon: '◆' },
  { type: 'todo',    label: 'Yapacağım', color: C.purple, dim: C.purpleDim, icon: '▲' },
];

function SwipeRow({ onDelete, children }: { onDelete: () => void; children: React.ReactNode }) {
  const tx = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  const snapBack = () => {
    Animated.parallel([
      Animated.spring(tx, { toValue: 0, useNativeDriver: true, tension: 130, friction: 9 }),
      Animated.timing(reveal, { toValue: 0, duration: 180, useNativeDriver: false }),
    ]).start();
  };

  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < Math.abs(g.dx),
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

  return (
    <View style={{ overflow: 'hidden' }}>
      <Animated.View style={[sw.deleteZone, { opacity: reveal }]}>
        <Pressable style={sw.deleteBtn} onPress={() => { snapBack(); onDelete(); }}>
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
  deleteZone: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 76, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,90,126,0.15)' },
  deleteBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: C.danger },
  deleteTxt: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
});

function JournalItemRow({ item, color, onDelete, onUpdate }: { item: JournalItem; color: string; onDelete: () => void; onUpdate: (content: string) => void }) {
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
          <TextInput style={ir.input} value={draft} onChangeText={setDraft} onBlur={commit} onSubmitEditing={commit} autoFocus multiline selectionColor={color} returnKeyType="done" />
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
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 11, backgroundColor: 'rgba(255,255,255,0.025)' },
  bullet: { width: 5, height: 5, borderRadius: 3, marginTop: 8, marginRight: 12, flexShrink: 0 },
  text: { flex: 1, fontSize: 15, color: C.text, lineHeight: 22, letterSpacing: 0.15, opacity: 0.88 },
  input: { flex: 1, fontSize: 15, color: C.text, lineHeight: 22, letterSpacing: 0.15, padding: 0 },
});

function JournalSection({ type, label, color, dim, icon, items, onAdd, onDelete, onUpdate }: SectionCfg & {
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
    Animated.timing(chevronAnim, { toValue: collapsed ? 1 : 0, duration: 210, useNativeDriver: true }).start();
    setCollapsed(v => !v);
  };

  const submitAdd = () => {
    const t = newText.trim();
    if (t) onAdd(type, t);
    setNewText('');
    setAdding(false);
  };

  const chevronRotate = chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] });

  return (
    <View style={[sec.wrap, { borderColor: `${color}22` }]}>
      <Pressable style={sec.header} onPress={toggleCollapse}>
        <View style={[sec.iconBadge, { backgroundColor: dim }]}>
          <Text style={[sec.icon, { color }]}>{icon}</Text>
        </View>
        <Text style={[sec.label, { color }]}>{label}</Text>
        <Text style={sec.count}>{items.length}</Text>
        <Animated.Text style={[sec.chevron, { transform: [{ rotate: chevronRotate }] }]}>›</Animated.Text>
      </Pressable>

      {!collapsed && (
        <>
          {items.map(item => (
            <JournalItemRow
              key={item.id}
              item={item}
              color={color}
              onDelete={() => onDelete(item.id)}
              onUpdate={(content) => onUpdate(item.id, content)}
            />
          ))}
          {adding ? (
            <View style={sec.addRow}>
              <View style={[sec.addBullet, { backgroundColor: color }]} />
              <TextInput
                style={sec.addInput}
                value={newText}
                onChangeText={setNewText}
                placeholder="Yeni not..."
                placeholderTextColor={C.textDim}
                autoFocus
                multiline
                returnKeyType="done"
                selectionColor={color}
                onSubmitEditing={submitAdd}
                onBlur={submitAdd}
              />
            </View>
          ) : (
            <Pressable style={sec.addBtn} onPress={() => setAdding(true)}>
              <Text style={[sec.addBtnTxt, { color }]}>+ Ekle</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const sec = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 14, marginBottom: 12, overflow: 'hidden', backgroundColor: C.surface },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  iconBadge: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  icon: { fontSize: 10, fontWeight: '700' },
  label: { flex: 1, fontSize: 14, fontWeight: '600', letterSpacing: 0.4 },
  count: { fontSize: 12, color: C.textMuted, marginRight: 8 },
  chevron: { fontSize: 20, color: C.textMuted },
  addRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 11 },
  addBullet: { width: 5, height: 5, borderRadius: 3, marginTop: 8, marginRight: 12, flexShrink: 0 },
  addInput: { flex: 1, fontSize: 15, color: C.text, lineHeight: 22, padding: 0 },
  addBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  addBtnTxt: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3, opacity: 0.8 },
});

export default function BugunScreen() {
  const { user } = useAuth();
  const today = new Date();
  const dateStr = toDateStr(today);

  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [instrLoading, setInstrLoading] = useState(true);

  const { entry, loading: journalLoading, loadEntry, ensureEntry, handleAdd, handleUpdate, handleDelete } = useJournal(user?.id);
  const { videos, loadVideos, addNewVideo, removeVideo } = useVideos();

  // Video picker + title modal state
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const [isSavingVideo, setIsSavingVideo] = useState(false);

  // Player state
  const [playerVideo, setPlayerVideo] = useState<JournalVideo | null>(null);
  const [playerVisible, setPlayerVisible] = useState(false);
  // Track per-video view counts locally (not persisted to DB in this version)
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    getUserInstruments(user.id).then(data => {
      setInstruments(data);
      setInstrLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!user || instruments.length === 0) return;
    const instrument = instruments[activeIdx];
    if (!instrument) return;

    setEntryId(null);
    ensureEntry(instrument.id, dateStr).then(e => {
      if (e) {
        setEntryId(e.id);
        loadEntry(instrument.id, dateStr);
        loadVideos(e.id);
      }
    });
  }, [user, instruments, activeIdx, dateStr]);

  const handlePickVideo = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'İzin Gerekli',
        'Video seçmek için galeri erişim izni gerekiyor. Ayarlar > Voxsy bölümünden izin verebilirsiniz.',
        [{ text: 'Tamam' }],
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
      allowsEditing: false,
    });

    if (result.canceled || result.assets.length === 0) return;

    setPendingUri(result.assets[0].uri);
    setTitleInput('');
    setTitleModalVisible(true);
  }, []);

  const handleSaveVideo = useCallback(async () => {
    if (!pendingUri || !entryId) return;
    setIsSavingVideo(true);
    try {
      await addNewVideo(entryId, pendingUri, titleInput.trim() || undefined);
    } finally {
      setIsSavingVideo(false);
      setTitleModalVisible(false);
      setPendingUri(null);
      setTitleInput('');
    }
  }, [pendingUri, entryId, titleInput, addNewVideo]);

  const handleOpenPlayer = useCallback((video: JournalVideo) => {
    setPlayerVideo(video);
    setPlayerVisible(true);
  }, []);

  const handlePlayerOpened = useCallback(() => {
    if (!playerVideo) return;
    setViewCounts(prev => ({
      ...prev,
      [playerVideo.id]: (prev[playerVideo.id] ?? 0) + 1,
    }));
  }, [playerVideo]);

  const onAdd = useCallback(
    (type: JournalItemType, content: string) => {
      if (entryId) handleAdd(entryId, type, content);
    },
    [entryId, handleAdd],
  );

  const itemsByType = (type: JournalItemType): JournalItem[] =>
    (entry?.items ?? []).filter(i => i.type === type);

  if (instrLoading) {
    return (
      <View style={st.center}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
  }

  if (instruments.length === 0) {
    return (
      <View style={st.center}>
        <Text style={st.emptyTitle}>Enstrüman seçilmedi</Text>
        <Text style={st.emptySub}>Profil ayarlarından enstrümanını ekle.</Text>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={st.dateHeader}>
        <Text style={st.dayNum}>{today.getDate()}</Text>
        <View>
          <Text style={st.dayName}>{TR_DAYS[today.getDay()]}</Text>
          <Text style={st.monthYear}>{TR_MONTHS[today.getMonth()]} {today.getFullYear()}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.tabsScroll} contentContainerStyle={st.tabsContent}>
        {instruments.map((inst, i) => (
          <Pressable key={inst.id} style={[st.tab, i === activeIdx && st.tabActive]} onPress={() => setActiveIdx(i)}>
            <Text style={st.tabEmoji}>{inst.emoji}</Text>
            <Text style={[st.tabLabel, i === activeIdx && st.tabLabelActive]}>{inst.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={st.body} contentContainerStyle={st.bodyContent} keyboardShouldPersistTaps="handled">
          {journalLoading ? (
            <ActivityIndicator color={C.gold} style={{ marginTop: 40 }} />
          ) : (
            SECTIONS.map(cfg => (
              <JournalSection
                key={cfg.type}
                {...cfg}
                items={itemsByType(cfg.type)}
                onAdd={onAdd}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))
          )}

          <View style={st.videoSection}>
            <View style={st.videoHeader}>
              <Text style={st.videoTitle}>Videolar</Text>
              {videos.length > 0 && (
                <View style={st.videoBadge}>
                  <Text style={st.videoBadgeTxt}>{videos.length}</Text>
                </View>
              )}
            </View>

            {videos.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={st.thumbRow}
                style={st.thumbScroll}
              >
                {videos.map(v => (
                  <VideoThumbnailCard
                    key={v.id}
                    video={v}
                    viewCount={viewCounts[v.id] ?? 0}
                    onPlay={handleOpenPlayer}
                    onDelete={removeVideo}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={st.videoEmpty}>
                <Text style={st.videoEmptyTxt}>Henüz video yok</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [st.videoAddBtn, pressed && st.videoAddBtnPressed]}
              onPress={handlePickVideo}
            >
              <Text style={st.videoAddTxt}>+ Video Ekle</Text>
            </Pressable>
          </View>

          {/* Title input modal */}
          <Modal
            visible={titleModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setTitleModalVisible(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={st.modalOverlay}
            >
              <View style={st.titleCard}>
                <Text style={st.titleHeading}>Video Başlığı</Text>
                <Text style={st.titleSub}>İsteğe bağlı — boş bırakabilirsiniz</Text>
                <TextInput
                  style={st.titleInput}
                  placeholder="ör. Barre akoru çalışması"
                  placeholderTextColor={C.textDim}
                  value={titleInput}
                  onChangeText={setTitleInput}
                  maxLength={80}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveVideo}
                  autoFocus
                  selectionColor={C.gold}
                />
                <View style={st.titleActions}>
                  <Pressable
                    style={st.cancelBtn}
                    onPress={() => { setTitleModalVisible(false); setPendingUri(null); }}
                  >
                    <Text style={st.cancelTxt}>İptal</Text>
                  </Pressable>
                  <Pressable
                    style={[st.saveBtn, isSavingVideo && st.saveBtnDisabled]}
                    onPress={handleSaveVideo}
                    disabled={isSavingVideo}
                  >
                    {isSavingVideo
                      ? <ActivityIndicator size="small" color={C.bg} />
                      : <Text style={st.saveTxt}>Ekle</Text>
                    }
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          {/* Full-screen player */}
          <VideoPlayerModal
            video={playerVideo}
            viewCount={playerVideo ? (viewCounts[playerVideo.id] ?? 0) : 0}
            isVisible={playerVisible}
            onClose={() => setPlayerVisible(false)}
            onOpened={handlePlayerOpened}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  emptyTitle: { fontSize: 18, color: C.text, fontWeight: '600' },
  emptySub: { marginTop: 8, fontSize: 14, color: C.textMuted },
  dateHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 14 },
  dayNum: { fontSize: 56, fontFamily: SERIF, color: C.gold, lineHeight: 60 },
  dayName: { fontSize: 16, color: C.text, fontWeight: '600' },
  monthYear: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  tabsScroll: { maxHeight: 52 },
  tabsContent: { paddingHorizontal: 16, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, gap: 6 },
  tabActive: { borderColor: C.goldBorder, backgroundColor: 'rgba(201,168,76,0.08)' },
  tabEmoji: { fontSize: 16 },
  tabLabel: { fontSize: 13, color: C.textMuted },
  tabLabelActive: { color: C.gold, fontWeight: '600' },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  videoSection: { marginTop: 8 },
  videoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  videoTitle: { fontSize: 14, color: C.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  videoBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  videoBadgeTxt: { fontSize: 11, fontWeight: '700', color: C.bg },
  thumbScroll: { marginBottom: 10 },
  thumbRow: { paddingRight: 4 },
  videoEmpty: { alignItems: 'center', paddingVertical: 20, borderWidth: 1, borderColor: C.border, borderRadius: 12, borderStyle: 'dashed', marginBottom: 10 },
  videoEmptyTxt: { color: C.textDim, fontSize: 14 },
  videoAddBtn: { paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.goldBorder, borderRadius: 12, backgroundColor: 'rgba(201,168,76,0.05)' },
  videoAddBtnPressed: { backgroundColor: 'rgba(201,168,76,0.12)' },
  videoAddTxt: { color: C.gold, fontSize: 14, fontWeight: '600' },
  // Title input modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  titleCard: { backgroundColor: '#12121E', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 24, paddingTop: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, gap: 10 },
  titleHeading: { fontSize: 17, fontWeight: '700', color: C.text },
  titleSub: { fontSize: 12, color: C.textMuted, marginTop: -4 },
  titleInput: { backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, marginTop: 4 },
  titleActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center' },
  cancelTxt: { fontSize: 15, fontWeight: '600', color: C.textMuted },
  saveBtn: { flex: 2, paddingVertical: 13, borderRadius: 10, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.55 },
  // C.bg on C.gold: #080810 on #C9A84C → contrast ~6.4:1 ✅ WCAG AA
  saveTxt: { fontSize: 15, fontWeight: '700', color: C.bg },
});
