import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme';
import { loginUser, getCurrentUser, signupUser } from '../api';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignup, setIsSignup] = useState(false);
  const [challengePhrase, setChallengePhrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const formSlideAnim = useRef(new Animated.Value(0)).current;
  const buttonPressAnim = useRef(new Animated.Value(1)).current;
  const keyboardAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Initial entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for decorative elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      Animated.timing(keyboardAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      Animated.timing(keyboardAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          navigation.replace(user.role === 'admin' ? 'AdminDashboard' : 'CaptureReference', { email: user.email });
        }
      } catch (err) {
        console.error('Error checking login status:', err);
      }
    };
    
    checkLoginStatus();
  }, [navigation]);

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const animateFormSwitch = () => {
    Animated.sequence([
      Animated.timing(formSlideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleModeSwitch = () => {
    setIsSignup(!isSignup);
    setError(null);
    animateFormSwitch();
  };

  const handleButtonPress = async () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonPressAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonPressAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      setLoading(true);
      setError(null);
      
      if (isSignup) {
        await signupUser(email, name, password, role, challengePhrase);
        Alert.alert(
          'Success', 
          'Account created successfully! Please sign in.',
          [{ text: 'OK', onPress: () => setIsSignup(false) }]
        );
      } else {
        const response = await loginUser(email, password, role);
        navigation.replace(role === 'admin' ? 'AdminDashboard' : 'UserDashboard', { email });
      }
    } catch (err: any) {
      let errorMessage = 'An error occurred. Please try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection and ensure the server is running.';
      }
      
      setError(errorMessage);
      shakeError();
      console.error(isSignup ? 'Signup error:' : 'Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const keyboardTranslateY = keyboardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -50],
  });

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <LinearGradient
        colors={['#ffffff', '#fefcfa', '#ffffff']}
        style={styles.container}
      >
        {/* Decorative background elements */}
        <Animated.View
          style={[
            styles.decorativeCircle1,
            { transform: [{ scale: pulseAnim }] }
          ]}
        />
        <Animated.View
          style={[
            styles.decorativeCircle2,
            { transform: [{ scale: pulseAnim }] }
          ]}
        />

        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideUpAnim },
                  { scale: scaleAnim },
                  { translateY: keyboardTranslateY }
                ],
              },
            ]}
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                style={styles.iconContainer}
              >
                <Ionicons name="lock-closed" size={32} color="#fff" />
              </LinearGradient>
              <Text style={styles.title}>{isSignup ? 'Create Account' : 'Welcome Back'}</Text>
              <Text style={styles.subtitle}>
                {isSignup 
                  ? 'Join SwaPehchaan for secure identity verification' 
                  : 'Sign in to continue to your account'
                }
              </Text>
            </View>

            {/* Role Switch */}
            <View style={styles.roleSection}>
              <Text style={styles.roleSectionTitle}>Select Role</Text>
              <View style={styles.roleSwitch}>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'user' && styles.roleBtnActive]}
                  onPress={() => setRole('user')}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name="person" 
                    size={18} 
                    color={role === 'user' ? '#fff' : '#FF6B35'} 
                    style={styles.roleIcon}
                  />
                  <Text style={[styles.roleBtnText, role === 'user' && styles.roleBtnTextActive]}>
                    User
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'admin' && styles.roleBtnActive]}
                  onPress={() => setRole('admin')}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name="shield-checkmark" 
                    size={18} 
                    color={role === 'admin' ? '#fff' : '#FF6B35'} 
                    style={styles.roleIcon}
                  />
                  <Text style={[styles.roleBtnText, role === 'admin' && styles.roleBtnTextActive]}>
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Section */}
            <Animated.View
              style={[
                styles.formSection,
                { transform: [{ translateX: formSlideAnim }, { translateX: shakeAnim }] }
              ]}
            >
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color="#FF6B35" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="rgba(51, 51, 51, 0.5)"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Name Input (Signup only) */}
              {isSignup && (
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={20} color="#FF6B35" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="rgba(51, 51, 51, 0.5)"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color="#FF6B35" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(51, 51, 51, 0.5)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="rgba(51, 51, 51, 0.5)" 
                  />
                </TouchableOpacity>
              </View>

              {/* Challenge Phrase (Signup only) */}
              {isSignup && (
                <View style={styles.inputContainer}>
                  <Ionicons name="key" size={20} color="#FF6B35" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Challenge phrase (for recovery)"
                    placeholderTextColor="rgba(51, 51, 51, 0.5)"
                    value={challengePhrase}
                    onChangeText={setChallengePhrase}
                  />
                </View>
              )}

              {/* Error Message */}
              {error && (
                <Animated.View style={[styles.errorContainer, { transform: [{ translateX: shakeAnim }] }]}>
                  <Ionicons name="warning" size={16} color="#FF4444" style={styles.errorIcon} />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              {/* Main Action Button */}
              <Animated.View style={{ transform: [{ scale: buttonPressAnim }] }}>
                <TouchableOpacity
                  style={[
                    styles.signInBtn, 
                    ((!email || !password || (isSignup && (!name || !challengePhrase))) || loading) && styles.signInBtnDisabled
                  ]}
                  disabled={(!email || !password || (isSignup && (!name || !challengePhrase))) || loading}
                  onPress={handleButtonPress}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={
                      ((!email || !password || (isSignup && (!name || !challengePhrase))) || loading)
                        ? ['#cccccc', '#aaaaaa']
                        : ['#FF6B35', '#F7931E', '#FF8C42']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.signInBtnText}>
                          {isSignup ? 'Create Account' : 'Sign In'}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Switch Mode Button */}
              <TouchableOpacity 
                style={styles.switchModeBtn}
                onPress={handleModeSwitch}
                activeOpacity={0.8}
              >
                <Text style={styles.switchModeBtnText}>
                  {isSignup ? 'Already have an account?' : "Don't have an account?"}
                </Text>
                <Text style={styles.switchModeBtnAction}>
                  {isSignup ? ' Sign In' : ' Sign Up'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(247, 147, 30, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(247, 147, 30, 0.1)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  formContainer: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: THEME.fontFamily,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(51, 51, 51, 0.7)',
    fontFamily: THEME.fontFamily,
    textAlign: 'center',
    lineHeight: 24,
  },
  roleSection: {
    width: '100%',
    marginBottom: 32,
  },
  roleSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    fontFamily: THEME.fontFamily,
  },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 16,
    padding: 4,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  roleBtnActive: {
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  roleIcon: {
    marginRight: 6,
  },
  roleBtnText: {
    color: '#FF6B35',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: THEME.fontFamily,
  },
  roleBtnTextActive: {
    color: '#fff',
  },
  formSection: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    fontFamily: THEME.fontFamily,
  },
  eyeIcon: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    flex: 1,
    fontFamily: THEME.fontFamily,
  },
  signInBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  signInBtnDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  signInBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: THEME.fontFamily,
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  switchModeBtnText: {
    color: 'rgba(51, 51, 51, 0.7)',
    fontSize: 16,
    fontFamily: THEME.fontFamily,
  },
  switchModeBtnAction: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: THEME.fontFamily,
  },
});