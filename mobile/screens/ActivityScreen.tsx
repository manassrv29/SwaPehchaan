import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme';
import { getUserActivities, logoutUser } from '../api';

interface Activity {
  id: number;
  activity_type: string;
  details: string;
  status: string;
  created_at: string;
  ip_address: string;
}

export default function ActivityScreen({ navigation }: any) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserActivities();
      setActivities(data.activities || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to load activities');
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return '🔑';
      case 'photo_upload':
        return '📷';
      case 'face_verification':
        return '👤';
      case 'liveness_check':
        return '👁️';
      case 'certificate_submission':
        return '📝';
      default:
        return '📋';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderItem = ({ item }: { item: Activity }) => (
    <View style={styles.activityItem}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getActivityIcon(item.activity_type)}</Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityType}>
          {item.activity_type.replace(/_/g, ' ').toUpperCase()}
        </Text>
        <Text style={styles.activityDetails}>{item.details}</Text>
        <Text style={styles.activityDate}>{formatDate(item.created_at)}</Text>
        <View style={styles.statusContainer}>
          <Text
            style={[
              styles.activityStatus,
              item.status === 'success' ? styles.statusSuccess : styles.statusFailed
            ]}
          >
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
        <Text style={styles.title}>Activity Log</Text>
        <View style={styles.placeholder} />
      </View>
      
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchActivities}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No activities found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    flex: 1,
    textAlign: 'center',
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  activityItem: {
    backgroundColor: COLORS.white,
    borderRadius: THEME.borderRadius,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  activityContent: {
    flex: 1,
  },
  activityType: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: COLORS.border,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  activityStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusSuccess: {
    backgroundColor: COLORS.success + '20',
    color: COLORS.success,
  },
  statusFailed: {
    backgroundColor: COLORS.error + '20',
    color: COLORS.error,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: THEME.borderRadius,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: COLORS.border,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  logoutBtn: {
    padding: 8,
  },
  placeholder: {
    width: 40, // Same width as logout button for centering
  },
});
