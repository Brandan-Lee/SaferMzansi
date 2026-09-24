import React, { useState } from 'react';

import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
const ForgotPasswordScreen = ({ navigation }) => {
  
  const [email, setEmail] = useState('');
  
  const handleSendOTP = () => {

    if (email.trim() === '') {
      Alert.alert(
        'Error',
        'Please enter your email address.'
      );

      return;
    }

    if (!email.includes('@')) {
      Alert.alert(
        'Error',
        'Please enter a valid email address.'        
      );

      return;
    }

    if (navigation) {
     navigation.navigate('OTP');

    }

  };

  return (

    <SafeAreaView style={styles.container}>

      <View style={styles.content}>

        {/* SaferMzansi Logo Area */}

        <View style={styles.logoContainer}>

          <Text style={styles.logoIcon}>

          </Text>

          <Text style={styles.logoText}>
            SaferMzansi
          </Text>

        </View>

        {/*Title */}

        <Text style={styles.title}>
          Forgot Password?
        </Text>

        {/*Description */}

        <Text style={styles.description}>
          Enter your email address and{'\n'}
          we'll send you a OTP to reset{'\n'}
          your Password.
        </Text>

        {/* Email Input */}

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#777777"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {/* Send OTP Button */}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSendOTP}
        >
          <Text style={styles.buttonText}>
            Send OTP
          </Text>

        </TouchableOpacity>

        {/* Back to Login */}

        <TouchableOpacity
          onPress={() => {
            if (navigation) {
              navigation.goBack();
            }
          }} 
        >
          <Text style={styles.backText}>
                Back to Login
          </Text>

        </TouchableOpacity>
             
      </View>

    </SafeAreaView>

  );
};

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',

  },

  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 45,
    alignItems: 'center',
  },

  /* Logo */
  logoContainer: {
    alignItems: 'center',
    marginBottom: 55,
  },

  logoIcon: {
    fontSize: 38,
    color: '#7B16D9',
    fontWeight: 'bold',
  },

  logoText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#7B16D9',
  },

  /* Title */
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#171717',
    marginBottom: 35, 
  },

  /* Description */
  description: {
    width: '100%',
    fontSize: 20,
    lineHeight: 30,
    color: '#777777',
    marginBottom: 55,
  },

  /* Email Input */
  input: {
    width: '100%',
    height: 60,
    backgroundColor: '#F7F5F8',
    borderWidth: 1,
    borderColor: '#ECE8EF',
    borderRadius: 14,
    paddingHorizontal: 20,
    fontSize: 17,
    color: '#111111',
  },

  /* Send OTP Button */
  button: {
    width: '100%',
    height: 58,
    backgroundColor: '#7A0AD9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  /* Back to Login */
  backText: {
    color: '#6F20B8',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 65,
  },
});

export default ForgotPasswordScreen;
