import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Stub — implemented in ASY-20
export default function ProfilScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.sub}>Profil ayarların yakında burada.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080810' },
  title: { fontSize: 24, fontWeight: '600', color: '#F0EBE3' },
  sub: { marginTop: 8, fontSize: 14, color: 'rgba(240,235,227,0.4)' },
});
