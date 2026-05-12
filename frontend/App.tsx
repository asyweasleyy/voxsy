import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

export default function App() {
  console.log('[Voxsy] App rendered');
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Voxsy çalışıyor ✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080810',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#C9A84C',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
