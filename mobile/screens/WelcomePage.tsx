import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme';

const { width, height } = Dimensions.get('window');

export default function WelcomePage({ navigation }: any) {
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Sequential animations on mount
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
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
      ]),
    ]).start();

    // Continuous logo rotation
    Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      })
    ).start();

    // Continuous pulse animation for decorative elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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
  }, []);

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleProceedPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Login');
    });
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <LinearGradient
        colors={['#ffffff', '#fff8f5', '#ffffff']}
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
        <Animated.View
          style={[
            styles.decorativeCircle3,
            { transform: [{ rotate: logoRotate }] }
          ]}
        />

        {/* Main Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideUpAnim },
                { scale: scaleAnim }
              ],
            },
          ]}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Animated.View
              style={[
                styles.logoWrap,
                { transform: [{ rotate: logoRotate }] }
              ]}
            >
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                style={styles.logoGradient}
              >
                <Image source={require('../assets/icon.png')} style={styles.logo} />
              </LinearGradient>
            </Animated.View>
            
            {/* Floating particles around logo */}
            <View style={styles.particleContainer}>
              <Animated.View style={[styles.particle, styles.particle1, { transform: [{ scale: pulseAnim }] }]} />
              <Animated.View style={[styles.particle, styles.particle2, { transform: [{ scale: pulseAnim }] }]} />
              <Animated.View style={[styles.particle, styles.particle3, { transform: [{ scale: pulseAnim }] }]} />
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.textSection}>
            <Text style={styles.title}>SwaPehchaan</Text>
            <View style={styles.titleUnderline} />
            <Text style={styles.subtitle}>
              Seamless Life Certificate Submission
            </Text>
            <Text style={styles.description}>
              Experience secure, fast, and reliable digital identity verification
            </Text>
          </View>

          {/* Features Icons */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="shield-checkmark" size={24} color="#FF6B35" />
              </View>
              <Text style={styles.featureText}>Secure</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="flash" size={24} color="#F7931E" />
              </View>
              <Text style={styles.featureText}>Fast</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#FF8C42" />
              </View>
              <Text style={styles.featureText}>Reliable</Text>
            </View>
          </View>
        </Animated.View>

        {/* Proceed Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: buttonScaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={handleProceedPress}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FF6B35', '#F7931E', '#FF8C42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
            </LinearGradient>
          </TouchableOpacity>
          
        
        </Animated.View>
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
    top: -100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(247, 147, 30, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(247, 147, 30, 0.1)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: height * 0.3,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 140, 66, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.15)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  logoSection: {
    position: 'relative',
    marginBottom: 40,
  },
  logoWrap: {
    shadowColor: '#FF6B35',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
  },
  logoGradient: {
    borderRadius: 50,
    padding: 20,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logo: {
    width: 60,
    height: 60,
    tintColor: '#fff',
  },
  particleContainer: {
    position: 'absolute',
    width: 150,
    height: 150,
    top: -25,
    left: -25,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
  particle1: {
    top: 20,
    right: 10,
    backgroundColor: '#FF6B35',
  },
  particle2: {
    bottom: 30,
    left: 15,
    backgroundColor: '#F7931E',
  },
  particle3: {
    top: 60,
    left: -5,
    backgroundColor: '#FF8C42',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
    fontFamily: THEME.fontFamily,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#F7931E',
    borderRadius: 2,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
    fontFamily: THEME.fontFamily,
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: 'rgba(51, 51, 51, 0.7)',
    fontFamily: THEME.fontFamily,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    fontFamily: THEME.fontFamily,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 60,
    left: 32,
    right: 32,
    alignItems: 'center',
  },
  proceedButton: {
    width: '100%',
    marginBottom:-20,
    borderRadius: 36,
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: THEME.fontFamily,
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: THEME.fontFamily,
  },
});