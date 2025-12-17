import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CustomText from '../components/CustomText';
import type { NavigationProp } from '@react-navigation/native';

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp<any>>();

  return (
    <LinearGradient
      colors={['#ff7e5f', '#feb47b', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <CustomText type="h1" style={styles.title}>Settings</CustomText>
        </View>

        <CustomText style={styles.subtitle}>
          Choose a category.
        </CustomText>

        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => navigation.navigate('SettingsUserProfile')}
        >
          <View style={styles.categoryLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: '#4ecdc4' }]}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
            <View style={styles.categoryText}>
              <CustomText type="h2" style={styles.categoryTitle}>User Profile</CustomText>
              <CustomText style={styles.categoryDescription}>Set your display name.</CustomText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => navigation.navigate('SettingsDriverDefaults')}
        >
          <View style={styles.categoryLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: '#45b7d1' }]}>
              <Ionicons name="car" size={20} color="#fff" />
            </View>
            <View style={styles.categoryText}>
              <CustomText type="h2" style={styles.categoryTitle}>Driver Defaults</CustomText>
              <CustomText style={styles.categoryDescription}>Prefill info when offering a ride.</CustomText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => navigation.navigate('SettingsNotifications')}
        >
          <View style={styles.categoryLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: '#ff6b6b' }]}>
              <Ionicons name="notifications" size={20} color="#fff" />
            </View>
            <View style={styles.categoryText}>
              <CustomText type="h2" style={styles.categoryTitle}>Notifications</CustomText>
              <CustomText style={styles.categoryDescription}>Reset notification preferences.</CustomText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#666" />
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    color: '#fff',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  categoryCard: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 4,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    color: '#000',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
  },
});
