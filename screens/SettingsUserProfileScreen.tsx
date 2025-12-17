import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-simple-toast';
import { useNavigation } from '@react-navigation/native';
import CustomText from '../components/CustomText';
import { ValidationService } from '../services/validationService';
import { getUserSettings, saveUserSettings } from '../utils/userSettings';

export default function SettingsUserProfileScreen() {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [userNameError, setUserNameError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const settings = await getUserSettings();
        setUserName(settings.name);
      } catch (error) {
        console.error('Error loading user settings:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!ValidationService.checkRateLimit('saveSettingsUserProfile', 5, 60000)) {
      ValidationService.showRateLimitModal('save settings', 5, 60000);
      return;
    }

    // Validate user name (only if not empty)
    if (userName.trim()) {
      const validation = ValidationService.validateName(userName);
      setUserNameError(validation.error || '');
      if (!validation.isValid) return;
    } else {
      setUserNameError('');
    }

    const success = await saveUserSettings({ name: userName });
    if (success) {
      Toast.show('User profile saved!', Toast.BOTTOM);
      setTimeout(() => navigation.goBack(), 700);
    } else {
      Toast.show('Failed to save settings.', Toast.BOTTOM);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#ff7e5f', '#feb47b', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <CustomText>Loading...</CustomText>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#ff7e5f', '#feb47b', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <CustomText type="h1" style={styles.title}>User Profile</CustomText>
        </View>

        <View style={styles.settingSection}>
          <CustomText style={styles.label}>Your Name:</CustomText>
          <TextInput
            style={[styles.input, userNameError ? styles.inputError : null]}
            value={userName}
            onChangeText={(text) => {
              setUserName(text);
              setUserNameError('');
            }}
            placeholder="Enter your name"
            maxLength={60}
          />
          {userNameError ? <CustomText style={styles.errorText}>{userNameError}</CustomText> : null}

          <CustomText style={styles.description}>
            This name will be used when you join pollies as a passenger or driver.
          </CustomText>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <CustomText style={styles.saveText}>Save</CustomText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontFamily: 'Neucha_400Regular',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#28a745',
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
  },
});

