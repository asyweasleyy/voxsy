import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Stub — implemented in ASY-17
export default function InstrumentSelectionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Enstrüman seçimi yakında...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080810' },
  text: { color: '#C9A84C', fontSize: 16 },
});
