import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from './CustomText';
import { ValidationService } from '../services/validationService';
import type { Driver } from '../models/driver.model';

interface AddDriverModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (driver: Driver) => Promise<boolean>;
}

export default function AddDriverModal({ visible, onClose, onSubmit }: AddDriverModalProps) {
  const [driverName, setDriverName] = useState('');
  const [driverDescription, setDriverDescription] = useState('');
  const [driverSpots, setDriverSpots] = useState('1');
  const [driverNameError, setDriverNameError] = useState('');
  const [driverDescriptionError, setDriverDescriptionError] = useState('');
  const [driverSpotsError, setDriverSpotsError] = useState('');

  const resetDriverErrors = () => {
    setDriverNameError('');
    setDriverDescriptionError('');
    setDriverSpotsError('');
  };

  const handleSubmit = async () => {
    if (!ValidationService.checkRateLimit('createDriver', 5, 60000)) {
      ValidationService.showRateLimitModal('create driver', 5, 60000);
      onClose();
      return;
    }

    const validation = ValidationService.validateDriverForm(driverName, driverDescription, parseInt(driverSpots));

    if (!validation.isValid) {
      setDriverNameError(validation.errors.name || '');
      setDriverDescriptionError(validation.errors.description || '');
      setDriverSpotsError(validation.errors.spots || '');
      return;
    }

    const driver: Driver = {
      name: driverName,
      description: driverDescription,
      spots: parseInt(driverSpots),
      consumers: []
    };

    // Fire the submit operation asynchronously - errors will be handled by toasts
    onSubmit(driver);

    // Reset form and close modal immediately after validation
    setDriverName('');
    setDriverDescription('');
    setDriverSpots('1');
    resetDriverErrors();
    onClose();
  };

  const handleClose = () => {
    resetDriverErrors();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <CustomText type="h2" style={styles.modalTitle}>Add Driver</CustomText>

          <CustomText style={styles.label}>Who will drive?</CustomText>
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
          {driverNameError ? <CustomText style={styles.errorText}>{driverNameError}</CustomText> : null}

          <CustomText style={styles.label}>Where will you wait with your car? At what Time?</CustomText>
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
          {driverDescriptionError ? <CustomText style={styles.errorText}>{driverDescriptionError}</CustomText> : null}

          <CustomText style={styles.label}>Available spots?</CustomText>
          <TextInput
            style={[styles.input, driverSpotsError ? styles.inputError : null]}
            value={driverSpots}
            onChangeText={(text) => {
              setDriverSpots(text.replace(/[^0-9]/g, ''));
              resetDriverErrors();
            }}
            keyboardType="numeric"
            placeholder="Number of spots"
          />
          {driverSpotsError ? <CustomText style={styles.errorText}>{driverSpotsError}</CustomText> : null}

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <CustomText>Cancel</CustomText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <CustomText style={styles.submitText}>Add Driver</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
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
  },
});