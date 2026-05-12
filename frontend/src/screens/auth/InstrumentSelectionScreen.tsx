import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp as StackNavigationProp } from '@react-navigation/native-stack';
import {
  getAllInstruments,
  setUserInstruments,
  type Instrument,
} from '../../services/instruments.service';
import { useAuth } from '../../hooks/useAuth';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'InstrumentSelection'>;
};

const { width: SW } = Dimensions.get('window');
const COLS = 2;
const GAP = 12;
const CARD_W = (SW - 32 - GAP) / COLS;

const C = {
  bg: '#080810',
  surface: 'rgba(255,255,255,0.04)',
  surfaceRaised: 'rgba(255,255,255,0.07)',
  gold: '#C9A84C',
  goldMuted: 'rgba(201,168,76,0.55)',
  goldGlow: 'rgba(201,168,76,0.12)',
  goldBorder: 'rgba(201,168,76,0.30)',
  goldBorderSel: 'rgba(201,168,76,0.90)',
  goldBg: 'rgba(201,168,76,0.10)',
  text: '#F0EBE3',
  textMuted: '#6B6577',
  textDim: '#3D3649',
  error: '#FF5A7E',
  border: 'rgba(255,255,255,0.07)',
} as const;

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

// ─── Instrument card ─────────────────────────────────────────────────────────

function InstrumentCard({
  item,
  selected,
  onPress,
}: {
  item: Instrument;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const check = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(glow, {
        toValue: selected ? 1 : 0,
        useNativeDriver: false,
        tension: 130,
        friction: 8,
      }),
      Animated.spring(check, {
        toValue: selected ? 1 : 0,
        useNativeDriver: true,
        tension: 220,
        friction: 10,
      }),
    ]).start();
  }, [selected]);

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [C.goldBorder, C.goldBorderSel],
  });
  const bgColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [C.surface, C.goldBg],
  });
  const checkScale = check.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 1.25, 1],
  });

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={item.name}
    >
      <Animated.View style={[styles.cardWrap, { transform: [{ scale }] }]}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.cardInner, { borderColor, backgroundColor: bgColor }]}
        >
          <Animated.View
            style={[styles.checkBadge, { transform: [{ scale: checkScale }], opacity: check }]}
          >
            <Text style={styles.checkMark}>✓</Text>
          </Animated.View>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
          <Text
            style={[styles.cardName, selected && styles.cardNameSel]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function InstrumentSelectionScreen({ navigation }: Props) {
  const { user } = useAuth();

  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingData(true);
    setError('');
    getAllInstruments()
      .then((data) => { if (!cancelled) setInstruments(data); })
      .catch(() => { if (!cancelled) setError('Enstrümanlar yüklenemedi. Lütfen tekrar dene.'); })
      .finally(() => { if (!cancelled) setLoadingData(false); });
    return () => { cancelled = true; };
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleDevamEt = async () => {
    if (!user || selected.size === 0) return;
    setSaving(true);
    setError('');
    try {
      await setUserInstruments(user.id, Array.from(selected));
      // Session is already set from registration; RootNavigator will switch to
      // MainTabs automatically. Reset auth stack so there's no stale history.
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      setError('Kaydedilemedi. Lütfen tekrar dene.');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: Instrument }) => (
      <InstrumentCard
        item={item}
        selected={selected.has(item.id)}
        onPress={() => toggle(item.id)}
      />
    ),
    [selected, toggle],
  );

  if (loadingData) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={styles.centered}>
          <ActivityIndicator color={C.gold} size="large" />
          <Text style={styles.loadingText}>Yükleniyor…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canProceed = selected.size > 0 && !saving;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={styles.glowTop} pointerEvents="none" />

      <FlatList
        data={instruments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={COLS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Animated.View
            style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            {/* Vinyl decoration */}
            <View style={styles.vinylWrap}>
              {([64, 48, 34, 22] as const).map((s, i) => (
                <View
                  key={s}
                  style={{
                    position: 'absolute',
                    width: s,
                    height: s,
                    borderRadius: s / 2,
                    borderWidth: i === 3 ? 2 : 1,
                    borderColor: `rgba(201,168,76,${[0.08, 0.14, 0.24, 0.55][i]})`,
                  }}
                />
              ))}
              <Text style={styles.noteIcon}>♩</Text>
            </View>

            <Text style={styles.title}>Enstrümanını Seç</Text>
            <Text style={styles.subtitle}>
              Çalmak istediğin enstrümanları işaretle.{'\n'}
              İstediğin zaman profilden değiştirebilirsin.
            </Text>

            {selected.size > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{selected.size} seçildi</Text>
              </View>
            )}

            <View style={styles.divider} />
          </Animated.View>
        }
      />

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.devamBtn, !canProceed && styles.devamBtnDisabled]}
          onPress={handleDevamEt}
          disabled={!canProceed}
          activeOpacity={0.84}
          accessibilityRole="button"
          accessibilityLabel="Devam Et"
          accessibilityState={{ disabled: !canProceed }}
        >
          {saving ? (
            <ActivityIndicator color={C.bg} size="small" />
          ) : (
            <Text style={[styles.devamBtnText, !canProceed && styles.devamBtnTextDisabled]}>
              Devam Et
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { color: C.textMuted, fontSize: 14, letterSpacing: 0.4 },

  glowTop: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: C.goldGlow,
    top: -80,
    alignSelf: 'center',
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  row: { gap: GAP, marginBottom: GAP },

  // header
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 28 : 16,
    paddingBottom: 20,
  },
  vinylWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  noteIcon: { fontSize: 22, color: C.gold },
  title: {
    fontSize: 26,
    fontFamily: SERIF,
    color: C.text,
    letterSpacing: 0.3,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  badge: {
    backgroundColor: C.goldBg,
    borderWidth: 1,
    borderColor: C.goldBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 10,
  },
  badgeText: { color: C.gold, fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  divider: {
    width: 36,
    height: 1.5,
    backgroundColor: C.goldMuted,
    borderRadius: 1,
    marginTop: 10,
    marginBottom: 4,
  },

  // card
  cardWrap: { width: CARD_W, height: 106 },
  cardInner: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    overflow: 'hidden',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: C.bg, fontSize: 11, fontWeight: '900', lineHeight: 14 },
  cardEmoji: { fontSize: 32, marginBottom: 6 },
  cardName: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
    textAlign: 'center',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  cardNameSel: { color: C.text },

  // footer
  footer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'android' ? 16 : 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  errorBox: {
    backgroundColor: 'rgba(255,90,126,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,90,126,0.28)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  errorText: { color: C.error, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  devamBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.gold,
    shadowOpacity: 0.38,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  devamBtnDisabled: {
    backgroundColor: C.surface,
    shadowOpacity: 0,
    elevation: 0,
  },
  devamBtnText: {
    color: C.bg,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  devamBtnTextDisabled: { color: C.textDim },
});
