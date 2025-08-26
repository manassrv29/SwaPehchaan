import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, THEME } from '../theme';
import { api } from '../api';

export default function CaptureReferenceScreen({ navigation, route }: any) {
  const { email } = route.params || {};
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0].uri) {
        setImage(result.assets[0].uri);
        setError(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const selectFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery permission is needed to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0].uri) {
        setImage(result.assets[0].uri);
        setError(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to add your reference photo',
      [
        { text: 'Camera', onPress: pickImage },
        { text: 'Gallery', onPress: selectFromGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#F8F9FA', '#FFFFFF']}
        style={styles.backgroundGradient}
      >
       

        {/* Content */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleSection}>
            <Ionicons name="camera" size={48} color={COLORS.primary} style={styles.titleIcon} />
            <Text style={styles.title}>Capture Your Face</Text>
            <Text style={styles.subtitle}>
              Take a clear photo of your face for secure verification. This will be your reference photo.
            </Text>
          </View>

          {/* Image Capture Area */}
          <View style={styles.imageSection}>
            <TouchableOpacity 
              style={styles.imageContainer} 
              onPress={showImageOptions}
              activeOpacity={0.8}
            >
              {image ? (
                <>
                  <Image source={{ uri: image }} style={styles.image} />
                  <View style={styles.imageOverlay}>
                    <TouchableOpacity style={styles.retakeButton} onPress={showImageOptions}>
                      <Ionicons name="camera" size={20} color={COLORS.white} />
                      <Text style={styles.retakeText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.imagePlaceholder}
                >
                  <Ionicons name="camera" size={48} color={COLORS.white} />
                  <Text style={styles.imagePlaceholderText}>Tap to Add Photo</Text>
                  <Text style={styles.imagePlaceholderSubtext}>Camera or Gallery</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
            
            {/* Guidelines */}
            <View style={styles.guidelines}>
              <Text style={styles.guidelinesTitle}>Photo Guidelines:</Text>
              <View style={styles.guidelineItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.guidelineText}>Face clearly visible</Text>
              </View>
              <View style={styles.guidelineItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.guidelineText}>Good lighting</Text>
              </View>
              <View style={styles.guidelineItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.guidelineText}>Look directly at camera</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.continueBtn, !image && styles.continueBtnDisabled]}
              disabled={!image || loading}
              onPress={async () => {
                if (!image) return;
                setLoading(true);
                setError(null);
                try {
                  const formData = new FormData();
                  formData.append('email', email);
                  // @ts-ignore
                  formData.append('image', { uri: image, name: 'reference.jpg', type: 'image/jpeg' });
                  await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                  Alert.alert(
                    'Success!', 
                    'Reference photo saved successfully.',
                    [{ text: 'OK', onPress: () => navigation.navigate('UserDashboard', { email }) }]
                  );
                } catch (err: any) {
                  setError(err?.response?.data?.error || err.message || 'Upload failed');
                } finally {
                  setLoading(false);
                }
              }}
            >
              <LinearGradient
                colors={!image ? [COLORS.border, COLORS.border] : [COLORS.primary, COLORS.secondary]}
                style={styles.continueGradient}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color={COLORS.white} style={styles.buttonIcon} />
                    <Text style={styles.continueBtnText}>Save Reference Photo</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                <Text style={styles.error}>{error}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* UserDashboard Navigation Button */}
        <TouchableOpacity 
          style={styles.dashboardButton}
          onPress={() => navigation.navigate('UserDashboard')}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.dashboardGradient}
          >
            <Ionicons name="home" size={24} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    
    padding: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  imagePlaceholder: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  imagePlaceholderText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  imagePlaceholderSubtext: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  retakeButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retakeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  guidelines: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    width: '100%',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  guidelineText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 8,
    fontWeight: '500',
  },
  actionSection: {
    marginTop: 'auto',
  },
  continueBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  continueBtnDisabled: {
    shadowOpacity: 0.1,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  buttonIcon: {
    marginRight: 8,
  },
  continueBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  error: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  dashboardButton: {
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
  dashboardGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
