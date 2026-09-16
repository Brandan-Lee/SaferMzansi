import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Import the RegistrationScreen component
import RegistrationScreen from './src/screens/auth/RegistrationScreen';

//Retrieve the API URL from environment variables
const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/health`;

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
      {/* Display backend connection status at the top */}
      <Text style={styles.statusText}>{status}</Text>
      
      {/* Render the registration screen as the main content */}
      <View style={styles.screenContainer}>
        <RegistrationScreen />
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  statusText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  screenContainer: {
    flex: 1,
  },
});