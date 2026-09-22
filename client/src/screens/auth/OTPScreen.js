import React, {useState} from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const OTPScreen = ({navigation}) => {
  const [otp, setOtp] = React.useState('');

  const handleResendCode = () => {
    Alert.alert('Resend Code', 'A new OTP has been sent to your email.');
  };
  return (
    <SafeAreaView style={styles.container}>

      <ScrollView contentContainerStyle={styles.ScrollViewContent} 
      showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.logo}>SaferMzansi</Text>
        <Text style={styles.title}>Verify Your Account</Text>
        <Text style={styles.subtitle}>Enter the OTP sent to your email</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          placeholderTextColor="#6B7280"
          keyboardType="numeric"
          value={otp}
          onChangeText={setOtp}
        />
        <Pressable style={styles.button} onPress={() => Alert.alert('OTP Verified')}>
          <Text style={styles.buttonText}>Verify code</Text>

        </Pressable>
        <Text style={styles.resendText}>Didn't receive the code?</Text>
        <Pressable onPress={handleResendCode}>
          <Text style={styles.resendButton}>Resend code</Text>
        </Pressable>

        <Pressable style={styles.backButton} onPress={() => navigation.navigate('ForgotPasswordScreen')}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
      </ScrollView>
      

      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#6A1B9A',
  },
  ScrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#6B7280',
    
  },
  
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#6B7280',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#6A1B9A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280', 
  },
  resendButton: {
    color: '#6A1B9A',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default OTPScreen;
