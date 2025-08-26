import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { COLORS, THEME } from '../theme';
import { api, logoutUser } from '../api';
import { useNavigation } from '@react-navigation/native';

interface Activity {
  id: number;
  user_id: number;
  user_email: string;
  activity_type: string;
  details: string;
  status: string;
  created_at: string;
  ip_address: string;
}

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reviews' | 'activities'>('reviews');

  useEffect(() => {
    fetchReviews();
    fetchActivities();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/reviews');
      setPendingReviews(res.data.reviews || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchActivities = async () => {
    setActivityLoading(true);
    setActivityError(null);
    try {
      const res = await api.get('/admin/activities');
      setActivities(res.data.activities || []);
    } catch (err: any) {
      setActivityError(err?.response?.data?.error || err.message || 'Failed to fetch activities');
    } finally {
      setActivityLoading(false);
    }
  };

  const handleReview = async (id: number, action: 'approve' | 'reject') => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/admin/review/${id}`, { action });
      fetchReviews();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Action failed');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutUser();
              (navigation as any).reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
    );
  };

  const renderActivityItem = ({ item }: { item: Activity }) => (
    <View style={styles.activityCard}>
      <Text style={styles.activityUser}>User: {item.user_email}</Text>
      <Text style={styles.activityType}>{item.activity_type.replace(/_/g, ' ').toUpperCase()}</Text>
      <Text style={styles.activityDetails}>{item.details}</Text>
      <View style={styles.activityFooter}>
        <Text style={styles.activityDate}>{new Date(item.created_at).toLocaleString()}</Text>
        <Text style={[styles.activityStatus, item.status === 'success' ? styles.statusSuccess : styles.statusFailed]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reviews' && styles.activeTab]} 
          onPress={() => setActiveTab('reviews')}
        >
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>Reviews</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'activities' && styles.activeTab]} 
          onPress={() => setActiveTab('activities')}
        >
          <Text style={[styles.tabText, activeTab === 'activities' && styles.activeTabText]}>Activities</Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'reviews' ? (
        <>
          <Text style={styles.subtitle}>Pending Manual Reviews</Text>
          {loading && <ActivityIndicator color={COLORS.primary} />}
          {error && <Text style={styles.error}>{error}</Text>}
          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 32 }}>
            {pendingReviews.length === 0 && !loading ? (
              <Text style={styles.empty}>No pending reviews</Text>
            ) : (
              pendingReviews.map((review) => (
                <View style={styles.card} key={review.id}>
                  <Text style={styles.cardText}>User: {review.user}</Text>
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleReview(review.id, 'approve')}>
                      <Text style={styles.actionText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReview(review.id, 'reject')}>
                      <Text style={styles.actionText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>User Activities</Text>
          {activityLoading && <ActivityIndicator color={COLORS.primary} />}
          {activityError && <Text style={styles.error}>{activityError}</Text>}
          <FlatList
            data={activities}
            renderItem={renderActivityItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: 32 }}
            ListEmptyComponent={
              !activityLoading ? <Text style={styles.empty}>No activities found</Text> : null
            }
          />
        </>
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
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8,
  },
  scroll: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: THEME.borderRadius,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardText: {
    fontSize: 16,
    marginBottom: 12,
    color: COLORS.text,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  approveBtn: {
    backgroundColor: COLORS.success,
    borderRadius: THEME.borderRadius,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  rejectBtn: {
    backgroundColor: COLORS.error,
    borderRadius: THEME.borderRadius,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
    color: COLORS.textLight,
    fontSize: 16,
  },
  error: {
    color: COLORS.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  // New styles for tabs and activities
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: THEME.borderRadius,
    backgroundColor: COLORS.lightGray,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontWeight: '600',
    color: COLORS.text,
  },
  activeTabText: {
    color: COLORS.white,
  },
  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: THEME.borderRadius,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityUser: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  activityDetails: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  activityStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusSuccess: {
    backgroundColor: COLORS.successLight,
    color: COLORS.success,
  },
  statusFailed: {
    backgroundColor: COLORS.errorLight,
    color: COLORS.error,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    borderRadius: THEME.borderRadius,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  logoutText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
});