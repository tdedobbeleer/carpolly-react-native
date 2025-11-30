import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, TextInput, FlatList } from 'react-native';
import Text from '../components/CustomText';
import { useRoute, useNavigation } from '@react-navigation/native';
import { dataService } from '../services/dataService';
import { ValidationService } from '../services/validationService';
import type { Polly } from '../models/polly.model';
import type { Driver } from '../models/driver.model';
import type { Consumer } from '../models/consumer.model';

export default function PollyDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as { id: string };

  const [polly, setPolly] = useState<Polly | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showAddConsumerModal, setShowAddConsumerModal] = useState(false);
  const [selectedDriverIndex, setSelectedDriverIndex] = useState(-1);

  // Add Driver Modal state
  const [driverName, setDriverName] = useState('');
  const [driverDescription, setDriverDescription] = useState('');
  const [driverSpots, setDriverSpots] = useState('1');
  const [driverNameError, setDriverNameError] = useState('');
  const [driverDescriptionError, setDriverDescriptionError] = useState('');
  const [driverSpotsError, setDriverSpotsError] = useState('');

  // Add Consumer Modal state
  const [consumerName, setConsumerName] = useState('');
  const [consumerComments, setConsumerComments] = useState('');
  const [consumerNameError, setConsumerNameError] = useState('');

  useEffect(() => {
    const unsubscribe = dataService.subscribeToPolly(id, (data) => {
      setPolly(data);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [id]);

  const resetDriverErrors = () => {
    setDriverNameError('');
    setDriverDescriptionError('');
    setDriverSpotsError('');
  };

  const resetConsumerErrors = () => {
    setConsumerNameError('');
  };

  const handleAddDriver = async () => {
    if (!ValidationService.checkRateLimit('createDriver', 5, 60000)) {
      ValidationService.showRateLimitModal('create driver', 5, 60000);
      return;
    }

    const validation = ValidationService.validateDriverForm(driverName, driverDescription, parseInt(driverSpots));

    setDriverNameError(validation.errors.name || '');
    setDriverDescriptionError(validation.errors.description || '');
    setDriverSpotsError(validation.errors.spots || '');

    if (!validation.isValid) return;

    const driver: Driver = {
      name: driverName,
      description: driverDescription,
      spots: parseInt(driverSpots),
      consumers: []
    };

    try {
      await dataService.createDriver(id, driver);
      setShowAddDriverModal(false);
      setDriverName('');
      setDriverDescription('');
      setDriverSpots('1');
      resetDriverErrors();
    } catch (error) {
      Alert.alert('Error', 'Failed to add driver');
    }
  };

  const handleAddConsumer = async () => {
    if (!ValidationService.checkRateLimit('addConsumer', 10, 60000)) {
      ValidationService.showRateLimitModal('add consumer', 10, 60000);
      return;
    }

    const validation = ValidationService.validateConsumerForm(consumerName, consumerComments);

    setConsumerNameError(validation.errors.name || '');

    if (!validation.isValid) return;

    const consumer: Consumer = {
      name: consumerName,
      comments: consumerComments || undefined
    };

    try {
      if (polly?.drivers && selectedDriverIndex >= 0) {
        const driver = polly.drivers[selectedDriverIndex];
        if (driver.id) {
          await dataService.createConsumer(id, driver.id, consumer);
          setShowAddConsumerModal(false);
          setConsumerName('');
          setConsumerComments('');
          resetConsumerErrors();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add consumer');
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    Alert.alert(
      'Confirm Removal',
      'Are you sure you want to remove this driver?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataService.deleteDriver(id, driverId);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove driver');
            }
          }
        }
      ]
    );
  };

  const handleDeleteConsumer = async (driverId: string, consumerId: string) => {
    Alert.alert(
      'Confirm Removal',
      'Are you sure you want to remove this passenger?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataService.deleteConsumer(id, driverId, consumerId);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove consumer');
            }
          }
        }
      ]
    );
  };

  const openAddConsumerModal = (driverIndex: number) => {
    setSelectedDriverIndex(driverIndex);
    setShowAddConsumerModal(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!polly) {
    return (
      <View style={styles.errorContainer}>
        <Text>Polly not found!</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{polly.description}</Text>

        <View style={styles.shareSection}>
          <TouchableOpacity style={styles.shareButton}>
            <Text>📱 WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Text>✈️ Telegram</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Text>📞 SMS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.driversHeader}>
          <Text style={styles.driversTitle}>Drivers and spots available</Text>
          <TouchableOpacity style={styles.addDriverButton} onPress={() => setShowAddDriverModal(true)}>
            <Text style={styles.addDriverText}>I'm a driver! 🚗</Text>
          </TouchableOpacity>
        </View>

        {(!polly.drivers || polly.drivers.length === 0) ? (
          <View style={styles.noDriversCard}>
            <Text>No drivers yet! Be a good parrot and offer a ride 🦜</Text>
          </View>
        ) : (
          <FlatList
            data={polly.drivers}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.driverCard}>
                <View style={styles.driverHeader}>
                  <Text style={styles.driverName}>{item.name}</Text>
                  <Text style={styles.spotsBadge}>{item.spots || 0}</Text>
                </View>
                <Text style={styles.driverDescription}>When & where? {item.description}</Text>

                <View style={styles.consumersList}>
                  {item.consumers && item.consumers.length > 0 ? (
                    item.consumers.map((consumer, consumerIndex) => (
                      <View key={consumer.id || consumerIndex} style={styles.consumerItem}>
                        <Text>{consumer.name}</Text>
                        <TouchableOpacity
                          onPress={() => consumer.id && item.id && handleDeleteConsumer(item.id, consumer.id)}
                          style={styles.deleteButton}
                        >
                          <Text style={styles.deleteText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text>No passengers yet 😔</Text>
                  )}
                </View>

                <View style={styles.driverActions}>
                  <TouchableOpacity
                    style={[styles.joinButton, (item.consumers?.length || 0) >= (item.spots || 0) && styles.disabledButton]}
                    onPress={() => openAddConsumerModal(index)}
                    disabled={(item.consumers?.length || 0) >= (item.spots || 0)}
                  >
                    <Text>I wanna join this ride! 🚶</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => item.id && handleDeleteDriver(item.id)}
                    style={styles.deleteDriverButton}
                  >
                    <Text style={styles.deleteText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Add Driver Modal */}
      <Modal visible={showAddDriverModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Driver</Text>

            <Text style={styles.label}>Who will drive?</Text>
            <TextInput
              style={[styles.input, driverNameError ? styles.inputError : null]}
              value={driverName}
              onChangeText={(text) => {
                setDriverName(text);
                resetDriverErrors();
              }}
              placeholder="Driver name"
              maxLength={60}
            />
            {driverNameError ? <Text style={styles.errorText}>{driverNameError}</Text> : null}

            <Text style={styles.label}>Where will you wait with your car? At what Time?</Text>
            <TextInput
              style={[styles.input, driverDescriptionError ? styles.inputError : null]}
              value={driverDescription}
              onChangeText={(text) => {
                setDriverDescription(text);
                resetDriverErrors();
              }}
              placeholder="Meeting details"
              maxLength={255}
            />
            {driverDescriptionError ? <Text style={styles.errorText}>{driverDescriptionError}</Text> : null}

            <Text style={styles.label}>Available spots?</Text>
            <TextInput
              style={[styles.input, driverSpotsError ? styles.inputError : null]}
              value={driverSpots}
              onChangeText={(text) => {
                setDriverSpots(text);
                resetDriverErrors();
              }}
              keyboardType="numeric"
              placeholder="Number of spots"
            />
            {driverSpotsError ? <Text style={styles.errorText}>{driverSpotsError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddDriverModal(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleAddDriver}>
                <Text style={styles.submitText}>Add Driver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Consumer Modal */}
      <Modal visible={showAddConsumerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Driver</Text>

            <Text style={styles.label}>Your Name:</Text>
            <TextInput
              style={[styles.input, consumerNameError ? styles.inputError : null]}
              value={consumerName}
              onChangeText={(text) => {
                setConsumerName(text);
                resetConsumerErrors();
              }}
              placeholder="Your name"
              maxLength={60}
            />
            {consumerNameError ? <Text style={styles.errorText}>{consumerNameError}</Text> : null}

            <Text style={styles.label}>Comments (optional):</Text>
            <TextInput
              style={styles.input}
              value={consumerComments}
              onChangeText={setConsumerComments}
              placeholder="Any comments"
              maxLength={255}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddConsumerModal(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleAddConsumer}>
                <Text style={styles.submitText}>Join Ride</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  shareSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  driversHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  driversTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addDriverButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  addDriverText: {
    color: '#000',
    fontWeight: 'bold',
  },
  noDriversCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  driverCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  spotsBadge: {
    backgroundColor: '#007bff',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
  },
  driverDescription: {
    marginBottom: 10,
  },
  consumersList: {
    marginBottom: 15,
  },
  consumerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginBottom: 5,
  },
  driverActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  joinButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  deleteDriverButton: {
    padding: 10,
  },
  deleteButton: {
    padding: 5,
  },
  deleteText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  submitText: {
    color: '#000',
    fontWeight: 'bold',
  },
});