import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { signUp } from '../../services/auth.service';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Register'>;
};

const { width } = Dimensions.get('window');

const C = {
  bg: '#080810',
  surface: 'rgba(255,255,255,0.04)',
  surfaceRaised: 'rgba(255,255,255,0.07)',
  gold: '#C9A84C',
  goldMuted: 'rgba(201,168,76,0.6)',
  goldGlow: 'rgba(201,168,76,0.12)',
  goldBorder: 'rgba(201,168,76,0.35)',
  goldBorderFocus: 'rgba(201,168,76,0.85)',
  text: '#F0EBE3',
  textMuted: '#6B6577',
  textDim: '#3D3649',
  error: '#FF5A7E',
  border: 'rgba(255,255,255,0.08)',
};

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function VinylRings({ pulse }: { pulse: Animated.Value }) {
  return (
    <Animated.View style={[styles.vinylWrap, { transform: [{ scale: pulse }] }]}>
      {([160, 122, 88, 56, 28] as const).map((size, i) => (
        <View
          key={size}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: i === 4 ? 1.5 : 1,
            borderColor: `rgba(201,168,76,${[0.05, 0.09, 0.15, 0.28, 0.6][i]})`,
          }}
        />
      ))}
      <View style={styles.vinylCenter}>
        <Text style={styles.vinylLabel}>V</Text>
      </View>
    </Animated.View>
  );
}

function AuthInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  rightElement,
  editable = true,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'default';
  autoCapitalize?: 'none' | 'words';
  rightElement?: React.ReactNode;
  editable?: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const border = anim.interpolate({ inputRange: [0, 1], outputRange: [C.goldBorder, C.goldBorderFocus] });
  return (
    <Animated.View style={[styles.inputWrap, { borderColor: border }]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textDim}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoCorrect={false}
        onFocus={() => Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
        onBlur={() => Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
        editable={editable}
        selectionColor={C.gold}
      />
      {rightElement && <View style={styles.inputRight}>{rightElement}</View>}
    </Animated.View>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const label = ['', 'Zayıf', 'Orta', 'Güçlü', 'Çok Güçlü'][score];
  const barColor = score <= 1 ? C.error : score === 2 ? '#F0A500' : '#52D98F';
  return (
    <View style={styles.strengthRow}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={[styles.strengthBar, { backgroundColor: i < score ? barColor : 'rgba(255,255,255,0.08)' }]} />
      ))}
      <Text style={styles.strengthLabel}>{label}</Text>
    </View>
  );
}

function mapError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already been registered')) return 'Bu e-posta zaten kayıtlı.';
  if (msg.includes('invalid email') || msg.includes('Invalid email')) return 'Geçerli bir e-posta gir.';
  if (msg.includes('Password should') || msg.includes('weak password')) return 'Şifre çok zayıf.';
  return 'Kayıt olurken hata oluştu. Tekrar dene.';
}

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 650, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 3000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleRegister = async () => {
    if (!name.trim()) { setError('Adını gir.'); return; }
    if (!email.trim()) { setError('E-posta adresini gir.'); return; }
    if (password.length < 8) { setError('Şifre en az 8 karakter olmalı.'); return; }
    setError('');
    setLoading(true);
    const { error } = await signUp(email.trim(), password, name.trim());
    setLoading(false);
    if (error) {
      setError(mapError(error.message));
    } else {
      navigation.navigate('InstrumentSelection');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={styles.glow} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.hero}>
            <VinylRings pulse={pulseAnim} />
          </View>

          <Animated.View style={[styles.brand, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.logo}>VOXSY</Text>
            <Text style={styles.tagline}>Müzik yolculuğuna başla</Text>
          </Animated.View>

          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.cardTitle}>Hesap Oluştur</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <AuthInput
              value={name}
              onChangeText={setName}
              placeholder="Adın Soyadın"
              autoCapitalize="words"
              editable={!loading}
            />

            <View style={styles.gap} />

            <AuthInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-posta"
              keyboardType="email-address"
              editable={!loading}
            />

            <View style={styles.gap} />

            <AuthInput
              value={password}
              onChangeText={setPassword}
              placeholder="Şifre (en az 8 karakter)"
              secureTextEntry={!showPw}
              editable={!loading}
              rightElement={
                <TouchableOpacity onPress={() => setShowPw(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.eyeBtn}>{showPw ? '●' : '○'}</Text>
                </TouchableOpacity>
              }
            />

            <PasswordStrength password={password} />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} activeOpacity={0.85} disabled={loading}>
              {loading
                ? <ActivityIndicator color={C.bg} size="small" />
                : <Text style={styles.primaryBtnText}>Kayıt Ol</Text>}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.footerText}>Zaten hesabın var mı? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Giriş Yap</Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: C.goldGlow,
    top: -60,
    left: width / 2 - 150,
  },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },
  hero: { height: 160, alignItems: 'center', justifyContent: 'center', marginTop: 36 },
  vinylWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  vinylCenter: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center',
  },
  vinylLabel: { color: C.bg, fontSize: 10, fontFamily: SERIF, fontWeight: '700' },
  brand: { alignItems: 'center', marginTop: 12, marginBottom: 24 },
  logo: { fontSize: 36, fontFamily: SERIF, color: C.text, letterSpacing: 10 },
  tagline: { marginTop: 6, fontSize: 13, color: C.textMuted, letterSpacing: 1.5 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
  },
  cardTitle: { fontSize: 20, fontFamily: SERIF, color: C.text, letterSpacing: 0.5, marginBottom: 20 },
  errorBox: {
    backgroundColor: 'rgba(255,90,126,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,90,126,0.3)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: { color: C.error, fontSize: 13, lineHeight: 18 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceRaised,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: { flex: 1, height: 52, paddingHorizontal: 16, color: C.text, fontSize: 15 },
  inputRight: { paddingRight: 14 },
  eyeBtn: { color: C.textMuted, fontSize: 16 },
  gap: { height: 12 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4, gap: 4 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, color: C.textMuted, marginLeft: 4, width: 64 },
  primaryBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: C.gold,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  primaryBtnText: { color: '#080810', fontSize: 15, fontWeight: '700', letterSpacing: 1.2 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { color: C.textMuted, fontSize: 14 },
  footerLink: { color: C.gold, fontSize: 14, fontWeight: '600' },
});
