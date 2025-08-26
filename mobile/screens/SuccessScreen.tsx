import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { COLORS, THEME } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function SuccessScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={96} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>Success!</Text>
      <Text style={styles.subtitle}>Your certificate has been submitted successfully.</Text>
      
      <TouchableOpacity style={styles.activityBtn} onPress={() => navigation.navigate('Activity')}>
        <Text style={styles.activityBtnText}>View Activity Log</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('UserDashboard')}>
        <Text style={styles.homeBtnText}>Back to Home</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconWrap: {
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 28,
    textAlign: 'center',
  },
  activityBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: THEME.borderRadius,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  activityBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 1,
  },
  homeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  homeBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 1,
  },
});
