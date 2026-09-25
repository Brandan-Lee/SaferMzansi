import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBadge } from "../../components/common/AlertBadge";
import { useNetStatus } from "../../utils/NetStatus";
import { API_BASE_URL } from "../../utils/config"; //To avoid hardcoding the API URL, we import it from the config file


const OTPScreen = ({ navigation, route }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [banner, setBanner] = useState(null);
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef([]);
  const { isOnline } = useNetStatus();
  const userEmail = route?.params?.email || '';

  // Timer countdown effect to avoid spamming the resend button
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Supports single digit entry AND multi-digit pasting
  const handleOtpChange = (text, index) => {
    const sanitizedText = text.replace(/[^0-9]/g, '');

    if (sanitizedText.length > 1) {
      // Pasted full or partial OTP code
      const pastedArray = sanitizedText.slice(0, 6).split('');
      const newOtp = [...otp];

      pastedArray.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });

      setOtp(newOtp);

      const nextFocusIndex = Math.min(pastedArray.length, 5);
      inputRefs.current[nextFocusIndex]?.focus();
      if (pastedArray.length === 6) Keyboard.dismiss();
      return;
    }

    // Single digit entry
    const updatedOtp = [...otp];
    updatedOtp[index] = sanitizedText;
    setOtp(updatedOtp);

    // Move focus to the next input box if the current one is filled and not the last box
    if (sanitizedText !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace to move focus to the previous input box
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  //Send a request to the server to resend the OTP email. Disable the button for 60 seconds after sending.
  const handleResendCode = async () => {
    if (timer > 0 || resending || loading) return;

    if (!isOnline) {
      setBanner({
        message: 'No internet connection. Please check your connection and try again.',
        type: 'error',
      });
      return;
    }

    //Set the resending state to true to show the loading indicator and prevent multiple requests
    setResending(true);

    // Clear any existing banners before sending the request
    setBanner(null);

    try {
      const response = await fetch(`${API_BASE_URL}/send-otp-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend OTP. Please try again later.');
      }

      setBanner({
        message: 'A new OTP has been sent to your email.',
        type: 'success',
      });

      // Reset the timer to 60 seconds after successfully resending the OTP
      setTimer(60);
    } catch (error) {
      setBanner({
        message: error.message || 'Failed to resend OTP. Please try again later.',
        type: 'error',
      });
    } finally {
      setResending(false);
    }
  };

  //Verifys the user's entered OTP by sending it to the server. If successful, navigates to the login screen.
  const handleVerifyCode = async () => {
    if (!isOnline) {
      setBanner({
        message: 'No internet connection. Please check your connection and try again.',
        type: 'error',
      });
      return;
    }

    //Checks to see if the user has entered all 6 digits of the OTP
    if (otp.some((digit) => digit === '')) {
      setBanner({
        message: 'Please enter the complete 6-digit OTP.',
        type: 'error',
      });
      return;
    }

    //Combines the individual digits into a single string to send to the server
    const enteredOtp = otp.join('');
    //Shows a loading indicator while the verification request is being processed
    setLoading(true);

    //Clear any existing banners before sending the request
    setBanner(null);

    try {
      //Sends a POST request to the server with the user's email and entered OTP for verification
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, otp: enteredOtp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP.');
      }

      setBanner({
        message: 'OTP verified successfully.',
        type: 'success',
      });

      setTimeout(() => {
        navigation.navigate('LoginScreen');
      }, 800);

    } catch (error) {
      setBanner({
        message: error.message || 'Failed to verify OTP. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.logo}>SaferMzansi</Text>
          <Text style={styles.title}>Verify Your Account</Text>
          <Text style={styles.subtitle}>
            Enter the OTP sent to <Text style={styles.emailHighlight}>{userEmail || 'your email'}</Text>
          </Text>

          {banner && <AlertBadge message={banner.message} type={banner.type} />}

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpBox,
                  digit !== '' && styles.filledOtpBox,
                ]}
                keyboardType="number-pad"
                maxLength={index === 0 ? 6 : 1} // Allows paste action on first box
                textAlign="center"
                value={digit}
                selectTextOnFocus
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
              />
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              (loading || pressed) && styles.buttonPressed,
            ]}
            onPress={handleVerifyCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Verify code</Text>
            )}
          </Pressable>

          <View style={styles.resendSection}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <Pressable
              onPress={handleResendCode}
              disabled={timer > 0 || resending || loading}
              style={styles.resendPressable}
            >
              {resending ? (
                <ActivityIndicator color="#6A1B9A" size="small" />
              ) : (
                <Text
                  style={[
                    styles.resendButtonText,
                    (timer > 0 || loading) && styles.disabledResendText,
                  ]}
                >
                  {timer > 0 ? `Resend code in ${timer}s` : 'Resend code'}
                </Text>
              )}
            </Pressable>
          </View>

          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6A1B9A',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
    color: '#4B5563',
    lineHeight: 20,
  },
  emailHighlight: {
    fontWeight: '600',
    color: '#111827',
  },
  otpContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  otpBox: {
    width: 44,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filledOtpBox: {
    borderColor: '#6A1B9A',
    backgroundColor: '#F3E8FF',
    color: '#6A1B9A',
  },
  button: {
    width: '100%',
    backgroundColor: '#6A1B9A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendSection: {
    alignItems: 'center',
    marginTop: 28,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendPressable: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 2,
  },
  resendButtonText: {
    color: '#6A1B9A',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledResendText: {
    color: '#9CA3AF',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  backButtonText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OTPScreen;
