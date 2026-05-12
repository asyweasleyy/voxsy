import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../services/auth.service';
import {
  getAllInstruments,
  getUserInstruments,
  setUserInstruments,
  type Instrument,
} from '../../services/instruments.service';

const { width: SW } = Dimensions.get('window');
const COLS = 3;
const GAP = 10;
const CARD_W = (SW - 48 - GAP * (COLS - 1)) / COLS;

const C = {
  bg: '#080810',
  surface: 'rgba(255,255,255,0.04)',
  surfaceRaised: 'rgba(255,255,255,0.07)',
  gold: '#C9A84C',
  goldMuted: 'rgba(201,168,76,0.55)',
  goldGlow: 'rgba(201,168,76,0.10)',
  goldBorder: 'rgba(201,168,76,0.30)',
  goldBorderSel: 'rgba(201,168,76,0.90)',
  goldBg: 'rgba(201,168,76,0.10)',
  text: '#F0EBE3',
  textMuted: 'rgba(240,235,227,0.45)',
  textDim: 'rgba(240,235,227,0.22)',
  border: 'rgba(255,255,255,0.07)',
  danger: '#FF5A7E',
  dangerDim: 'rgba(255,90,126,0.10)',
  dangerBorder: 'rgba(255,90,126,0.28)',
} as const;

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// ─── Instrument card (picker modal) ─────────────────────────────────────────

function InstrumentCard({
  item,
  selected,
  onPress,
}: {
  item: Instrument;
  selected: boolean;
  onPress: () => void;
}) {
  const glow = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const check = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(glow, { toValue: selected ? 1 : 0, useNativeDriver: false, tension: 130, friction: 8 }),
      Animated.spring(check, { toValue: selected ? 1 : 0, useNativeDriver: USE_NATIVE_DRIVER, tension: 220, friction: 10 }),
    ]).start();
  }, [selected]);

  const borderColor = glow.interpolate({ inputRange: [0, 1], outputRange: [C.goldBorder, C.goldBorderSel] });
  const bgColor = glow.interpolate({ inputRange: [0, 1], outputRange: [C.surface, C.goldBg] });
  const checkScale = check.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1.25, 1] });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.93, useNativeDriver: USE_NATIVE_DRIVER, tension: 300, friction: 10 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, tension: 200, friction: 8 }).start()}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={item.name}
    >
      <Animated.View style={[card.wrap, { transform: [{ scale }] }]}>
        <Animated.View style={[StyleSheet.absoluteFill, card.inner, { borderColor, backgroundColor: bgColor }]}>
          <Animated.View style={[card.checkBadge, { transform: [{ scale: checkScale }], opacity: check }]}>
            <Text style={card.checkMark}>✓</Text>
          </Animated.View>
          <Text style={card.emoji}>{item.emoji}</Text>
          <Text style={[card.name, selected && card.nameSel]} numberOfLines={1}>{item.name}</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const card = StyleSheet.create({
  wrap: { width: CARD_W, height: 90 },
  inner: { flex: 1, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', padding: 6, overflow: 'hidden' },
  checkBadge: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: C.bg, fontSize: 10, fontWeight: '900', lineHeight: 13 },
  emoji: { fontSize: 26, marginBottom: 4 },
  name: { fontSize: 10, fontWeight: '600', color: C.textMuted, textAlign: 'center', letterSpacing: 0.3, textTransform: 'uppercase' },
  nameSel: { color: C.text },
});

// ─── Instrument picker modal ─────────────────────────────────────────────────

function InstrumentPickerModal({
  visible,
  currentIds,
  onSave,
  onClose,
}: {
  visible: boolean;
  currentIds: Set<string>;
  onSave: (ids: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [allInstruments, setAllInstruments] = useState<Instrument[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(currentIds));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setSelected(new Set(currentIds));
    setError('');
    setLoading(true);
    getAllInstruments()
      .then(setAllInstruments)
      .catch(() => setError('Enstrümanlar yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [visible]);

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (selected.size === 0) {
      setError('En az bir enstrüman seçmelisin.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(Array.from(selected));
      onClose();
    } catch {
      setError('Kaydedilemedi. Tekrar dene.');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = useCallback(({ item }: { item: Instrument }) => (
    <InstrumentCard item={item} selected={selected.has(item.id)} onPress={() => toggle(item.id)} />
  ), [selected, toggle]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={picker.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        {/* Header */}
        <View style={picker.header}>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={picker.cancel}>İptal</Text>
          </TouchableOpacity>
          <Text style={picker.title}>Enstrümanları Düzenle</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} hitSlop={12}>
            {saving
              ? <ActivityIndicator size="small" color={C.gold} />
              : <Text style={picker.save}>Kaydet</Text>
            }
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={picker.errorBox}>
            <Text style={picker.errorTxt}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={picker.center}>
            <ActivityIndicator color={C.gold} size="large" />
          </View>
        ) : (
          <FlatList
            data={allInstruments}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            numColumns={COLS}
            columnWrapperStyle={picker.row}
            contentContainerStyle={picker.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              selected.size > 0 ? (
                <View style={picker.badge}>
                  <Text style={picker.badgeTxt}>{selected.size} seçildi</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  );
}

const picker = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  cancel: { fontSize: 15, color: C.textMuted },
  title: { fontSize: 16, fontWeight: '700', color: C.text, letterSpacing: 0.3 },
  save: { fontSize: 15, fontWeight: '700', color: C.gold },
  errorBox: { marginHorizontal: 16, marginTop: 12, backgroundColor: C.dangerDim, borderWidth: 1, borderColor: C.dangerBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  errorTxt: { color: C.danger, fontSize: 13, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  row: { gap: GAP, marginBottom: GAP },
  badge: { alignSelf: 'center', backgroundColor: C.goldBg, borderWidth: 1, borderColor: C.goldBorder, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 16 },
  badgeTxt: { color: C.gold, fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ProfilScreen() {
  const { user } = useAuth();

  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [instrLoading, setInstrLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: USE_NATIVE_DRIVER }).start();
  }, []);

  const loadInstruments = useCallback(() => {
    if (!user) return;
    setInstrLoading(true);
    getUserInstruments(user.id)
      .then(setInstruments)
      .catch(() => {})
      .finally(() => setInstrLoading(false));
  }, [user]);

  useEffect(() => { loadInstruments(); }, [loadInstruments]);

  const handleSaveInstruments = useCallback(async (ids: string[]) => {
    if (!user) return;
    await setUserInstruments(user.id, ids);
    loadInstruments();
  }, [user, loadInstruments]);

  const handleSignOut = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          await signOut();
          // RootNavigator detects session=null and routes to AuthStack
        },
      },
    ]);
  };

  const displayName = user?.user_metadata?.full_name as string | undefined;
  const email = user?.email ?? '';
  const initial = (displayName?.[0] ?? email[0] ?? '?').toUpperCase();
  const currentIds = new Set(instruments.map(i => i.id));

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View style={[st.header, { opacity: fadeAnim }]}>
          <View style={st.avatarWrap}>
            <Text style={st.avatarTxt}>{initial}</Text>
          </View>
          {displayName ? <Text style={st.name}>{displayName}</Text> : null}
          <Text style={st.email}>{email}</Text>
        </Animated.View>

        {/* Instruments section */}
        <Animated.View style={[st.section, { opacity: fadeAnim }]}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>Enstrümanlarım</Text>
            <TouchableOpacity onPress={() => setPickerVisible(true)} hitSlop={12}>
              <Text style={st.editBtn}>Düzenle</Text>
            </TouchableOpacity>
          </View>

          {instrLoading ? (
            <ActivityIndicator color={C.gold} style={{ marginVertical: 20 }} />
          ) : instruments.length === 0 ? (
            <Pressable style={st.emptyInstr} onPress={() => setPickerVisible(true)}>
              <Text style={st.emptyInstrIcon}>♩</Text>
              <Text style={st.emptyInstrTxt}>Enstrüman ekle</Text>
              <Text style={st.emptyInstrSub}>Hangi enstrümanı çaldığını seç</Text>
            </Pressable>
          ) : (
            <View style={st.instrList}>
              {instruments.map(inst => (
                <View key={inst.id} style={st.instrRow}>
                  <Text style={st.instrEmoji}>{inst.emoji}</Text>
                  <Text style={st.instrName}>{inst.name}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Sign out */}
        <Animated.View style={[st.section, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={st.signOutBtn}
            onPress={handleSignOut}
            disabled={signingOut}
            activeOpacity={0.75}
          >
            {signingOut
              ? <ActivityIndicator size="small" color={C.danger} />
              : <Text style={st.signOutTxt}>Çıkış Yap</Text>
            }
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>

      <InstrumentPickerModal
        visible={pickerVisible}
        currentIds={currentIds}
        onSave={handleSaveInstruments}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 60 },

  header: { alignItems: 'center', paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24 },
  avatarWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.goldBg, borderWidth: 2, borderColor: C.goldBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarTxt: { fontSize: 30, fontFamily: SERIF, color: C.gold },
  name: { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: 0.3, marginBottom: 4 },
  email: { fontSize: 13, color: C.textMuted, letterSpacing: 0.2 },

  section: { marginHorizontal: 16, marginBottom: 12, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.textMuted, letterSpacing: 0.6, textTransform: 'uppercase' },
  editBtn: { fontSize: 14, fontWeight: '600', color: C.gold },

  emptyInstr: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  emptyInstrIcon: { fontSize: 32, color: C.goldMuted, marginBottom: 10 },
  emptyInstrTxt: { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 4 },
  emptyInstrSub: { fontSize: 13, color: C.textMuted, textAlign: 'center' },

  instrList: { paddingVertical: 6 },
  instrRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  instrEmoji: { fontSize: 22 },
  instrName: { fontSize: 15, color: C.text, fontWeight: '500' },

  signOutBtn: {
    marginVertical: 4, paddingVertical: 16, alignItems: 'center',
    backgroundColor: C.dangerDim, borderWidth: 1, borderColor: C.dangerBorder, borderRadius: 16,
  },
  signOutTxt: { fontSize: 15, fontWeight: '700', color: C.danger, letterSpacing: 0.3 },
});
