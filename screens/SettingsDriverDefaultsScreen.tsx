import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-simple-toast';
import { useNavigation } from '@react-navigation/native';
import CustomText from '../components/CustomText';
import { ValidationService } from '../services/validationService';
import { getUserSettings, saveUserSettings } from '../utils/userSettings';

export default function SettingsDriverDefaultsScreen() {
  const navigation = useNavigation();
  const [driverDescription, setDriverDescription] = useState('');
  const [driverSpots, setDriverSpots] = useState('1');
  const [driverDescriptionError, setDriverDescriptionError] = useState('');
  const [driverSpotsError, setDriverSpotsError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const settings = await getUserSettings();
        setDriverDescription(settings.driverDescription);
        setDriverSpots(settings.driverSpots.toString());
      } catch (error) {
        console.error('Error loading user settings:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!ValidationService.checkRateLimit('saveSettingsDriverDefaults', 5, 60000)) {
      ValidationService.showRateLimitModal('save settings', 5, 60000);
      return;
    }

    // Validate driver description (only if not empty)
    if (driverDescription.trim()) {
      const validation = ValidationService.validateDescription(driverDescription);
      setDriverDescriptionError(validation.error || '');
      if (!validation.isValid) return;
    } else {
      setDriverDescriptionError('');
    }

    // Validate driver spots (only if not empty)
    let spotsNum: number | undefined;
    if (driverSpots.trim()) {
      const parsed = parseInt(driverSpots);
      if (isNaN(parsed)) {
        setDriverSpotsError('Spots must be a valid number');
        return;
      }
      const validation = ValidationService.validateSpots(parsed);
      setDriverSpotsError(validation.error || '');
      if (!validation.isValid) return;
      spotsNum = parsed;
    } else {
      setDriverSpotsError('');
    }

    const success = await saveUserSettings({
      driverDescription,
      ...(spotsNum !== undefined ? { driverSpots: spotsNum } : {}),
    });

    if (success) {
      Toast.show('Driver defaults saved!', Toast.BOTTOM);
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
          <CustomText type="h1" style={styles.title}>Driver Defaults</CustomText>
        </View>

        <View style={styles.settingSection}>
          <CustomText style={styles.label}>Default Meeting Description:</CustomText>
          <TextInput
            style={[styles.input, driverDescriptionError ? styles.inputError : null]}
            value={driverDescription}
            onChangeText={(text) => {
              setDriverDescription(text);
              setDriverDescriptionError('');
            }}
            placeholder="Where will you wait with your car? At what Time?"
            maxLength={255}
            multiline
            numberOfLines={2}
          />
          {driverDescriptionError ? <CustomText style={styles.errorText}>{driverDescriptionError}</CustomText> : null}

          <CustomText style={styles.label}>Default Number of Spots:</CustomText>
          <TextInput
            style={[styles.input, driverSpotsError ? styles.inputError : null]}
            value={driverSpots}
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, '');
              setDriverSpots(numericValue);
              setDriverSpotsError('');
            }}
            placeholder="Number of available spots"
            keyboardType="numeric"
            maxLength={2}
          />
          {driverSpotsError ? <CustomText style={styles.errorText}>{driverSpotsError}</CustomText> : null}

          <CustomText style={styles.description}>
            These defaults will be pre-filled when you offer to drive in pollies.
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

