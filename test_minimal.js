import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { registerRootComponent } from 'expo';

function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>RunFun 앱 테스트</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0C10' },
  text: { color: '#00E87A', fontSize: 24, fontWeight: 'bold' },
});

registerRootComponent(App);
