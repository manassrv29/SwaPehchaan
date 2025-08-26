import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, logoutUser, api } from '../api';
import { COLORS, THEME } from '../theme';

export default function UserDashboardScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasReferencePhoto, setHasReferencePhoto] = useState(false);

  useEffect(() => {
    loadUser();
    checkReferencePhoto();
  }, []);

  const checkReferencePhoto = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        // Check if user has reference photo
        const response = await api.get(`/user/${currentUser.email}/reference-status`);
        setHasReferencePhoto(response.data.hasReference || false);
      }
    } catch (error) {
      console.log('Could not check reference photo status');
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
      navigation.navigate('Login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logoutUser();
            navigation.navigate('Welcome');
          },
        },
      ]
    );
  };

  const handleFaceEnrollment = () => {
    if (hasReferencePhoto) {
      Alert.alert(
        'Reference Photo Exists',
        'You already have a reference photo enrolled. Do you want to update it?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Update', 
            onPress: () => navigation.navigate('CaptureReference', { email: user?.email })
          }
        ]
      );
    } else {
      navigation.navigate('CaptureReference', { email: user?.email });
    }
  };

  const handleSubmitCertificate = () => {
    navigation.navigate('LivenessCheck', { email: user?.email });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>User not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.avatar}
            >
              <Ionicons name="person" size={32} color={COLORS.white} />
            </LinearGradient>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.roleContainer}>
                <Text style={styles.userRole}>{user.role}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <View style={styles.logoutIconContainer}>
              <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.sectionTitle}>Face Recognition Services</Text>
          </View>
          
          <View style={styles.servicesContainer}>
            <TouchableOpacity style={[styles.serviceCard, styles.enrollCard]} onPress={handleFaceEnrollment}>
              <LinearGradient
                colors={['#FF7300', '#FFA040']}
                style={styles.serviceIconGradient}
              >
                <Ionicons name="camera" size={28} color={COLORS.white} />
              </LinearGradient>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceTitle}>Enroll Face</Text>
                <Text style={styles.serviceDescription}>
                  Capture your reference photo for future verification
                </Text>
                {hasReferencePhoto && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.statusText}>Enrolled</Text>
                  </View>
                )}
              </View>
              <View style={styles.chevronContainer}>
                <Ionicons name="chevron-forward" size={24} color={COLORS.border} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.serviceCard, styles.certificateCard]} onPress={handleSubmitCertificate}>
              <LinearGradient
                colors={['#43A047', '#66BB6A']}
                style={styles.serviceIconGradient}
              >
                <Ionicons name="shield-checkmark" size={28} color={COLORS.white} />
              </LinearGradient>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceTitle}>Submit Life Certificate</Text>
                <Text style={styles.serviceDescription}>
                  Verify your identity with face recognition and liveness check
                </Text>
              </View>
              <View style={styles.chevronContainer}>
                <Ionicons name="chevron-forward" size={24} color={COLORS.border} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.serviceCard, styles.activityCard]} 
              onPress={() => navigation.navigate('Activity')}
            >
              <LinearGradient
                colors={['#FFA040', '#FFB170']}
                style={styles.serviceIconGradient}
              >
                <Ionicons name="list" size={28} color={COLORS.white} />
              </LinearGradient>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceTitle}>Activity Log</Text>
                <Text style={styles.serviceDescription}>
                  View your verification history
                </Text>
              </View>
              <View style={styles.chevronContainer}>
                <Ionicons name="chevron-forward" size={24} color={COLORS.border} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Enhanced Bottom Navigation Button */}
      <TouchableOpacity 
        style={styles.bottomNavButton}
        onPress={() => navigation.navigate('UserDashboard')}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.bottomNavGradient}
        >
          <Ionicons name="home" size={24} color={COLORS.white} />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingTop: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 15,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 8,
    fontWeight: '400',
  },
  roleContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  userRole: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  logoutBtn: {
    padding: 4,
  },
  logoutIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 8,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  servicesContainer: {
    gap: 20,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 20,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  enrollCard: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  certificateCard: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.success,
  },
  activityCard: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
  },
  serviceIconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  serviceContent: {
    flex: 1,
    paddingRight: 12,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  serviceDescription: {
    fontSize: 15,
    color: COLORS.textLight,
    lineHeight: 22,
    fontWeight: '400',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  chevronContainer: {
    backgroundColor: COLORS.lightGray,
    padding: 8,
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 50,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 50,
    fontWeight: '600',
  },
  bottomNavButton: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  bottomNavGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
