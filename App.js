import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Devices from './Components/Devices'

export default function App() {
  return (
    <View style={styles.container}>
      <Devices />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
