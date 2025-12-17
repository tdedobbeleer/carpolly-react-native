import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-simple-toast';
import CustomText from '../components/CustomText';
import AlertModal from '../components/AlertModal';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export default function SettingsNotificationsScreen() {
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<AlertButton[]>([]);

  const handleClearNotificationSettings = () => {
    setAlertTitle('Clear Notification Settings');
    setAlertMessage('This will remove all notification settings for all pollies. You will no longer receive notifications for any polly changes. This action cannot be undone.');
    setAlertButtons([
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            // Get all keys that start with notification_settings_
            const keys = await AsyncStorage.getAllKeys();
            const notificationKeys = keys.filter((key: string) => key.startsWith('notification_settings_'));

            if (notificationKeys.length > 0) {
              await AsyncStorage.multiRemove(notificationKeys);
              Toast.show(`Cleared notification settings for ${notificationKeys.length} pollies.`, Toast.LONG);
            } else {
              Toast.show('No notification settings to clear.', Toast.SHORT);
            }
          } catch (error) {
            console.error('Error clearing notification settings:', error);
            Toast.show('Failed to clear notification settings.', Toast.SHORT);
          }
        },
      },
    ]);
    setShowAlertModal(true);
  };

  return (
    <LinearGradient
      colors={['#ff7e5f', '#feb47b', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <CustomText type="h1" style={styles.title}>Notifications</CustomText>
        </View>

        <View style={styles.settingSection}>
          <CustomText style={styles.description}>
            Reset all notification settings to stop receiving notifications for any polly changes. This will clear all saved notification preferences for all pollies.
          </CustomText>

          <TouchableOpacity style={styles.clearNotificationsButton} onPress={handleClearNotificationSettings}>
            <Ionicons name="notifications-off" size={20} color="#fff" />
            <CustomText style={styles.clearNotificationsText}>Reset All Notifications</CustomText>
          </TouchableOpacity>
        </View>

        <AlertModal
          visible={showAlertModal}
          title={alertTitle}
          message={alertMessage}
          buttons={alertButtons}
          onClose={() => setShowAlertModal(false)}
        />
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
  settingSection: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  clearNotificationsButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  clearNotificationsText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
});

