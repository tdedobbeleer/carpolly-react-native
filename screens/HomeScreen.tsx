import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Linking, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/CustomText';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { v4 as uuidv4 } from 'uuid';
import { dataService } from '../services/dataService';
import { ValidationService } from '../services/validationService';
import type { Polly } from '../models/polly.model';

type RootStackParamList = {
  Home: undefined;
  PollyDetail: { id: string };
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  const resetDescriptionError = () => {
    setDescriptionError('');
  };

  const onSubmit = async () => {
    // Check rate limiting
    if (!ValidationService.checkRateLimit('createPolly', 3, 60000)) {
      ValidationService.showRateLimitModal('create polly', 3, 60000);
      return;
    }

    // Comprehensive validation
    const validation = ValidationService.validatePollyDescription(description);

    setDescriptionError(validation.error || '');

    if (!validation.isValid) {
      return;
    }

    const id = uuidv4();
    const polly: Polly = {
      description: description,
      drivers: [],
      created: new Date()
    };

    try {
      await dataService.createPolly(id, polly);
      navigation.navigate('PollyDetail', { id });
    } catch (error) {
      Alert.alert('Error', 'Failed to create polly');
    }
  };

  const openFAQ = () => {
    Linking.openURL('https://carpolly.com/support');
  };

  return (
    <LinearGradient
      colors={['#ff7e5f', '#feb47b', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Let's get started!</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Describe your Polly</Text>
            <Text style={styles.hint}>Just keep it simple, e.g. Ice skating 10/11/2025</Text>
            <TextInput
              style={[styles.input, descriptionError ? styles.inputError : null]}
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                resetDescriptionError();
              }}
              placeholder="Enter description"
              maxLength={60}
              onSubmitEditing={onSubmit}
            />
            {descriptionError ? <Text style={styles.errorText}>{descriptionError}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={onSubmit}>
              <Text style={styles.buttonText}>Create a Carpolly!</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openFAQ}>
              <Text style={styles.link}>What in parrots name is this?!</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={require('../assets/parrot-below.png')}
            style={styles.parrotDecoration}
            resizeMode="contain"
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
    fontFamily: 'Neucha_400Regular',
  },
  card: {
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
    padding: 20,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  hint: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#007bff',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  parrotDecoration: {
    width: 100,
    height: 100,
    marginTop: -25,
    opacity: 0.8,
  },
});
