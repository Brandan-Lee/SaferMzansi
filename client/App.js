import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Replace YOUR_LOCAL_IP with your PC's IPv4 address (e.g., 192.168.1.15)
const API_URL = 'http://YOUR_LOCAL_IP:5000/api/health';

export default function App() {
  const [status, setStatus] = useState('Connecting to backend...');

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch((err) => {
        console.error(err);
        setStatus('Connection failed');
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hallo There!</Text>
      <Text style={styles.statusText}>{status}</Text>
      <StatusBar style="auto" />
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
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#555',
  },
});