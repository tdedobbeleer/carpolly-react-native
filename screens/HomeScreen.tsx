import 'react-native-get-random-values';
import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { v4 as uuidv4 } from 'uuid';
import { dataService } from '../services/dataService';
import { ValidationService } from '../services/validationService';
import type { Polly } from '../models/polly.model';
import CustomText from '../components/CustomText';

type RootStackParamList = {
  Home: undefined;
  PollyDetail: { id: string };
  About: undefined;
  FAQ: undefined;
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [pollyIds, setPollyIds] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    AsyncStorage.getItem('pollyIds').then(ids => {
      if (ids) {
        const parsed = JSON.parse(ids);
        setPollyIds(parsed);
      }
    });
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Fetch descriptions when screen is focused
      pollyIds.forEach((id: string) => {
        dataService.getPolly(id).then(polly => {
          if (polly) {
            setDescriptions(prev => ({ ...prev, [id]: polly.description || 'Unknown' }));
          }
        });
      });
    }, [pollyIds])
  );

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

    const result = await dataService.createPolly(id, polly);
    if (result !== null) {
      await savePollyIds([...pollyIds, id]);
      setDescriptions(prev => ({ ...prev, [id]: description }));
      navigation.navigate('PollyDetail', { id });
    }
  };

  const openAbout = () => {
    navigation.navigate('About');
  };

  const savePollyIds = async (ids: string[]) => {
    setPollyIds(ids);
    await AsyncStorage.setItem('pollyIds', JSON.stringify(ids));
  };

  const removePolly = async (id: string) => {
    const newIds = pollyIds.filter(i => i !== id);
    await savePollyIds(newIds);
    setDescriptions(prev => {
      const newDesc = { ...prev };
      delete newDesc[id];
      return newDesc;
    });
  };

  const clearAllPollies = async () => {
    await savePollyIds([]);
    setDescriptions({});
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
          <CustomText type="h1" style={styles.title}>Let's get started!</CustomText>
          <View style={styles.card}>
            <CustomText style={styles.label}>Describe your Polly</CustomText>
            <CustomText style={styles.hint}>Just keep it simple, e.g. Ice skating 10/11/2025</CustomText>
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
            {descriptionError ? <CustomText style={styles.errorText}>{descriptionError}</CustomText> : null}
            <TouchableOpacity style={styles.button} onPress={onSubmit}>
              <CustomText style={styles.buttonText}>Create a Carpolly!</CustomText>
            </TouchableOpacity>
            <TouchableOpacity onPress={openAbout}>
              <CustomText style={styles.link}>What in parrots name is this?!</CustomText>
            </TouchableOpacity>
          </View>
          {pollyIds.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <CustomText style={styles.label}>Your previous Carpollies</CustomText>
                <TouchableOpacity onPress={clearAllPollies}>
                  <CustomText>Clear All</CustomText>
                </TouchableOpacity>
              </View>
              {pollyIds.map((id) => (
                <View key={id} style={styles.pollyItem}>
                  <TouchableOpacity
                    style={styles.pollyContent}
                    onPress={() => navigation.navigate('PollyDetail', { id })}
                  >
                    <CustomText>{descriptions[id] || 'Loading...'}</CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removePolly(id)}>
                    <Ionicons name="trash" size={16} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
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
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
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
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
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
    fontFamily: "Neucha_400Regular",
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
  },
  link: {
    color: '#007bff',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pollyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 4,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  pollyContent: {
    flex: 1,
  },
  parrotDecoration: {
    width: 100,
    height: 100,
    marginTop: -45,
    opacity: 0.8,
  },
});
