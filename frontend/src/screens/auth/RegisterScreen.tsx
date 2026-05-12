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
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { signUp } from '../../services/auth.service';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Register'>;
};

const C = {
  bg: '#080810',
  surface: 'rgba(255,255,255,0.04)',
  surfaceRaised: 'rgba(255,255,255,0.07)',
  gold: '#C9A84C',
  goldGlow: 'rgba(201,168,76,0.12)',
  goldBorder: 'rgba(201,168,76,0.35)',
  goldBorderFocus: 'rgba(201,168,76,0.85)',
  text: '#F0EBE3',
  textMuted: '#6B6577',
  textDim: '#3D3649',
  error: '#FF5A7E',
  border: 'rgba(255,255,255,0.08)',
  green: '#4ADE80',
};

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Çok zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok güçlü'];
  const colors = ['#FF5A7E', '#FF5A7E', '#C9A84C', '#4ADE80', '#4ADE80'];
  return { score, label: pw ? labels[score] ?? labels[0] : '', color: colors[score] ?? colors[0] };
}

function AuthInput({
  value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, rightElement, editable = true,
}: {
  value: string; onChangeText: (t: string) => void; placeholder: string;
  secureTextEntry?: boolean; keyboardType?: 'email-address' | 'default';
  autoCapitalize?: 'none' | 'words'; rightElement?: React.ReactNode; editable?: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const border = anim.interpolate({ inputRange: [0, 1], outputRange: [C.goldBorder, C.goldBorderFocus] });
  return (
    <Animated.View style={[s.inputWrap, { borderColor: border }]}>
      <TextInput
        style={s.input}
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
      {rightElement && <View style={s.inputRight}>{rightElement}</View>}
    </Animated.View>
  );
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
  const strength = passwordStrength(password);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      setError('E-posta ve şifre gerekli.');
      return;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }
    setError('');
    setLoading(true);
    const { error: authError } = await signUp(email.trim(), password, name.trim() || undefined);
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      navigation.navigate('InstrumentSelection');
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Text style={s.backTxt}>← Geri</Text>
            </TouchableOpacity>
            <Text style={s.title}>Kayıt Ol</Text>
            <Text style={s.subtitle}>Müzik yolculuğuna başla</Text>
          </Animated.View>

          <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            <AuthInput value={name} onChangeText={setName} placeholder="Ad Soyad (isteğe bağlı)" autoCapitalize="words" editable={!loading} />
            <View style={s.gap} />
            <AuthInput value={email} onChangeText={setEmail} placeholder="E-posta" keyboardType="email-address" editable={!loading} />
            <View style={s.gap} />
            <AuthInput
              value={password}
              onChangeText={setPassword}
              placeholder="Şifre"
              secureTextEntry={!showPw}
              editable={!loading}
              rightElement={
                <TouchableOpacity onPress={() => setShowPw(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.eyeBtn}>{showPw ? '●' : '○'}</Text>
                </TouchableOpacity>
              }
            />
            {password.length > 0 && (
              <View style={s.strengthRow}>
                {[0, 1, 2, 3].map(i => (
                  <View key={i} style={[s.strengthBar, { backgroundColor: i < strength.score ? strength.color : 'rgba(255,255,255,0.08)' }]} />
                ))}
                <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}

            <TouchableOpacity style={s.primaryBtn} onPress={handleRegister} activeOpacity={0.85} disabled={loading}>
              {loading ? <ActivityIndicator color={C.bg} size="small" /> : <Text style={s.primaryBtnText}>Hesap Oluştur</Text>}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[s.footer, { opacity: fadeAnim }]}>
            <Text style={s.footerText}>Zaten hesabın var mı? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.footerLink}>Giriş Yap</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },
  header: { marginTop: 56, marginBottom: 32 },
  backBtn: { marginBottom: 20 },
  backTxt: { color: C.textMuted, fontSize: 14 },
  title: { fontSize: 28, fontFamily: SERIF, color: C.text, letterSpacing: 0.5 },
  subtitle: { marginTop: 6, fontSize: 14, color: C.textMuted },
  card: { backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 24 },
  errorBox: { backgroundColor: 'rgba(255,90,126,0.1)', borderWidth: 1, borderColor: 'rgba(255,90,126,0.3)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 },
  errorText: { color: C.error, fontSize: 13 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceRaised, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  input: { flex: 1, height: 52, paddingHorizontal: 16, color: C.text, fontSize: 15 },
  inputRight: { paddingRight: 14 },
  eyeBtn: { color: C.textMuted, fontSize: 16 },
  gap: { height: 12 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, marginLeft: 6 },
  primaryBtn: { height: 54, borderRadius: 14, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', marginTop: 20, elevation: 8 },
  primaryBtnText: { color: '#080810', fontSize: 15, fontWeight: '700', letterSpacing: 1.2 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { color: C.textMuted, fontSize: 14 },
  footerLink: { color: C.gold, fontSize: 14, fontWeight: '600' },
});
