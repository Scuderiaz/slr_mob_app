import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchConsumers } from '../../utils/api';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [consumers, setConsumers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    readToday: 0,
    remaining: 0,
    flagged: 0,
    completionPercentage: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
      
      // Set up auto-refresh listener
      const checkForUpdates = async () => {
        try {
          const lastUpdate = await AsyncStorage.getItem('lastDataUpdate');
          const currentCheck = await AsyncStorage.getItem('lastDashboardCheck');
          
          if (lastUpdate && lastUpdate !== currentCheck) {
            console.log('🔄 Dashboard: Auto-refresh triggered');
            setRefreshing(true);
            await loadDashboardData();
            await AsyncStorage.setItem('lastDashboardCheck', lastUpdate);
            
            // Show refresh message briefly
            setTimeout(() => setRefreshing(false), 1500);
          }
        } catch (error) {
          console.error('Error checking for updates:', error);
        }
      };
      
      // Check for updates every 2 seconds while screen is focused
      const interval = setInterval(checkForUpdates, 2000);
      
      return () => clearInterval(interval);
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      // Load user data
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const user = JSON.parse(userDataString);
        setUserData(user);
        
        // Load consumers for the user's zone (if meter reader)
        if (user.Role_Name === 'Meter Reader' || user.Role_Name === 'Admin') {
          const consumersResponse = await fetchConsumers();
          if (consumersResponse.success && consumersResponse.data) {
            let consumerData = consumersResponse.data;
            
            // Filter by user's zone if meter reader (not admin)
            if (user.Role_Name === 'Meter Reader' && user.Zone_ID) {
              consumerData = consumerData.filter((c: any) => c.Zone_ID === user.Zone_ID);
            }
            
            setConsumers(consumerData);
            
            // Calculate stats using correct status field
            const totalAssigned = consumerData.length;
            const readToday = consumerData.filter((c: any) => c.status === 'Read').length;
            const remaining = consumerData.filter((c: any) => c.status === 'Pending').length;
            const flagged = consumerData.filter((c: any) => c.status === 'Flagged').length;
            const completionPercentage = totalAssigned > 0 ? Math.round((readToday / totalAssigned) * 100) : 0;
            
            setStats({
              totalAssigned,
              readToday,
              remaining,
              flagged,
              completionPercentage
            });
            
            // Generate recent activity from actual data
            const activity = [];
            
            // Add completed readings
            const readConsumers = consumerData.filter((c: any) => c.status === 'Read').slice(0, 2);
            readConsumers.forEach((consumer: any) => {
              activity.push({
                type: 'reading',
                title: 'Reading completed',
                meta: `${consumer.First_Name} ${consumer.Last_Name} • ${consumer.Current_Reading || 0} m³ • Today`,
                icon: '✓',
                iconColor: '#155724',
                backgroundColor: '#d4edda'
              });
            });
            
            // Add flagged consumers
            const flaggedConsumers = consumerData.filter((c: any) => c.status === 'Flagged').slice(0, 1);
            flaggedConsumers.forEach((consumer: any) => {
              activity.push({
                type: 'flag',
                title: 'Consumer flagged',
                meta: `${consumer.First_Name} ${consumer.Last_Name} • Issue reported • Today`,
                icon: '⚠',
                iconColor: '#856404',
                backgroundColor: '#fff3cd'
              });
            });
            
            // Add sync activity
            activity.push({
              type: 'sync',
              title: 'Last sync',
              meta: `${readToday} readings uploaded • All data synced`,
              icon: '↻',
              iconColor: '#0c5460',
              backgroundColor: '#d1ecf1'
            });
            
            setRecentActivity(activity);
          }
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Auto-refresh indicator */}
      {refreshing && (
        <View style={styles.refreshIndicator}>
          <ActivityIndicator size="small" color="#1a73e8" style={styles.refreshSpinner} />
          <Text style={styles.refreshText}>🔄 Refreshing data...</Text>
        </View>
      )}
      
      {/* Today's Progress Card */}
      <LinearGradient
        colors={['#1a73e8', '#1557b0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <Text style={styles.heroLabel}>Today's Progress</Text>
        <Text style={styles.heroValue}>{stats.readToday}/{stats.totalAssigned}</Text>
        <Text style={styles.heroSubtext}>Meters Read</Text>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${stats.completionPercentage}%` }]} />
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.remaining}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#ffeb3b' }]}>{stats.flagged}</Text>
            <Text style={styles.statLabel}>Flagged</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Assigned Zone Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Assigned Zone</Text>
        <View style={styles.zoneCard}>
          <View style={styles.zoneHeader}>
            <View>
              <Text style={styles.zoneName}>
                {userData?.Zone_ID ? `Zone ${userData.Zone_ID}` : userData?.Zone_Name || 'All Zones'}
              </Text>
              <Text style={styles.zoneMuted}>{stats.totalAssigned} households assigned</Text>
            </View>
            <View style={styles.zoneRight}>
              <Text style={styles.zonePercent}>{stats.completionPercentage}%</Text>
              <Text style={styles.zoneComplete}>Complete</Text>
            </View>
          </View>
          
          <View style={styles.zoneStats}>
            <View style={styles.zoneStat}>
              <Text style={[styles.zoneStatValue, { color: '#4caf50' }]}>{stats.readToday}</Text>
              <Text style={styles.zoneStatLabel}>Read</Text>
            </View>
            <View style={styles.zoneStat}>
              <Text style={[styles.zoneStatValue, { color: '#ff9800' }]}>{stats.remaining}</Text>
              <Text style={styles.zoneStatLabel}>Pending</Text>
            </View>
            <View style={styles.zoneStat}>
              <Text style={[styles.zoneStatValue, { color: '#f44336' }]}>{stats.flagged}</Text>
              <Text style={styles.zoneStatLabel}>Issues</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Activity Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Recent Activity</Text>
        
        {recentActivity.length > 0 ? (
          recentActivity.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: activity.backgroundColor }]}>
                <Text style={{ color: activity.iconColor, fontSize: 16 }}>{activity.icon}</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityMeta}>{activity.meta}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#f8f9fa' }]}>
              <Text style={{ color: '#6b7280', fontSize: 16 }}>📋</Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>No recent activity</Text>
              <Text style={styles.activityMeta}>Start taking readings to see activity here</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f8',
  },
  heroCard: {
    margin: 12,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 56,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    width: '100%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  card: {
    backgroundColor: '#fff',
    margin: 12,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  zoneCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  zoneName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a73e8',
  },
  zoneMuted: {
    fontSize: 13,
    color: '#6b7280',
  },
  zoneRight: {
    alignItems: 'flex-end',
  },
  zonePercent: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4caf50',
  },
  zoneComplete: {
    fontSize: 11,
    color: '#6b7280',
  },
  zoneStats: {
    flexDirection: 'row',
    gap: 8,
  },
  zoneStat: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  zoneStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  zoneStatLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    marginHorizontal: 12,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1a73e8',
  },
  refreshSpinner: {
    marginRight: 8,
  },
  refreshText: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '500',
  },
});
