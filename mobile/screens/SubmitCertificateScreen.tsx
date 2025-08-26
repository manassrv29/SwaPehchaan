import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../api';
import { COLORS, THEME } from '../theme';

export default function SubmitCertificateScreen({ navigation, route }: any) {
  const { email, referenceImage } = route.params || {};
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      setCurrentImage(result.assets[0].uri);
    }
  };

  const submitAndVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Upload current image for verification
      const formData = new FormData();
      formData.append('email', email);
      // @ts-ignore
      formData.append('image', { uri: currentImage, name: 'current.jpg', type: 'image/jpeg' });
      await api.post('/upload/current', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      // 2. Call verify endpoint
      const verifyData = new FormData();
      verifyData.append('email', email);
      const verifyRes = await api.post('/verify', verifyData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { verified } = verifyRes.data;
      if (!verified) throw new Error('Face verification failed. Manual review required.');
      // 3. Proceed to liveness check screen
      navigation.navigate('LivenessCheck', { email });
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submit Certificate</Text>
      <Text style={styles.subtitle}>Take a new photo for verification and submit your certificate.</Text>
      <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
        {currentImage ? (
          <Image source={{ uri: currentImage }} style={styles.image} />
        ) : (
          <Text style={styles.imageBtnText}>Take Photo</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.submitBtn, !currentImage && styles.submitBtnDisabled]}
        disabled={!currentImage || loading}
        onPress={submitAndVerify}
      >
        <Text style={styles.submitBtnText}>Verify & Continue</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator style={{ marginTop: 16 }} color={COLORS.primary} />}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  imageBtn: {
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  imageBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  image: {
    width: 180,
    height: 180,
    borderRadius: 100,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  error: {
    color: COLORS.error,
    marginTop: 12,
    fontWeight: 'bold',
  },
});
