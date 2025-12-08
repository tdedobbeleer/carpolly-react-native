import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import CustomText from './CustomText';
import type { Driver } from '../models/driver.model';

interface EditDriverModalProps {
  visible: boolean;
  driver: Driver | null;
  onClose: () => void;
  onSubmit: (driver: Driver) => Promise<boolean>;
}

export default function EditDriverModal({ visible, driver, onClose, onSubmit }: EditDriverModalProps) {
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editingDriverSpots, setEditingDriverSpots] = useState('');
  const [editingDriverNameError, setEditingDriverNameError] = useState('');
  const [editingDriverDescriptionError, setEditingDriverDescriptionError] = useState('');
  const [editingDriverSpotsError, setEditingDriverSpotsError] = useState('');

  useEffect(() => {
    if (driver && visible) {
      setEditingDriver(driver);
      setEditingDriverSpots(driver.spots?.toString() || '1');
      setEditingDriverNameError('');
      setEditingDriverDescriptionError('');
      setEditingDriverSpotsError('');
    }
  }, [driver, visible]);

  const handleSubmit = async () => {
    if (!editingDriver) return;

    // Validate name
    if (!editingDriver.name || !editingDriver.name.trim()) {
      setEditingDriverNameError('Driver name is required.');
      return;
    }
    if (editingDriver.name.length > 60) {
      setEditingDriverNameError('Driver name must be 60 characters or less.');
      return;
    }

    // Validate description
    if (editingDriver.description && editingDriver.description.length > 255) {
      setEditingDriverDescriptionError('Description must be 255 characters or less.');
      return;
    }

    const newSpots = parseInt(editingDriverSpots);
    if (isNaN(newSpots) || newSpots < 1) {
      setEditingDriverSpotsError('Number of spots must be at least 1.');
      return;
    }

    const currentConsumers = editingDriver.consumers?.length || 0;
    if (newSpots < currentConsumers) {
      const errorMsg = `Cannot set spots to ${newSpots}. There are already ${currentConsumers} passengers.`;
      setEditingDriverSpotsError(errorMsg);
      return;
    }

    const updatedDriver = {
      ...editingDriver,
      name: editingDriver.name,
      description: editingDriver.description,
      spots: newSpots
    };

    // Fire the submit operation asynchronously - errors will be handled by toasts
    onSubmit(updatedDriver);
    onClose();
  };

  const handleClose = () => {
    setEditingDriverNameError('');
    setEditingDriverDescriptionError('');
    setEditingDriverSpotsError('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <CustomText type="h2" style={styles.modalTitle}>Edit Driver</CustomText>

          <CustomText style={styles.label}>Who will drive?</CustomText>
          <TextInput
            style={[styles.input, editingDriverNameError ? styles.inputError : null]}
            value={editingDriver?.name || ''}
            onChangeText={(text) => {
              setEditingDriver(prev => prev ? { ...prev, name: text } : null);
              setEditingDriverNameError('');
            }}
            placeholder="Driver name"
            maxLength={60}
          />
          {editingDriverNameError ? <CustomText style={styles.errorText}>{editingDriverNameError}</CustomText> : null}

          <CustomText style={styles.label}>Where will you wait with your car? At what Time?</CustomText>
          <TextInput
            style={[styles.input, editingDriverDescriptionError ? styles.inputError : null]}
            value={editingDriver?.description || ''}
            onChangeText={(text) => {
              setEditingDriver(prev => prev ? { ...prev, description: text } : null);
              setEditingDriverDescriptionError('');
            }}
            placeholder="Meeting details"
            maxLength={255}
          />
          {editingDriverDescriptionError ? <CustomText style={styles.errorText}>{editingDriverDescriptionError}</CustomText> : null}

          <CustomText style={styles.label}>Available spots?</CustomText>
          <TextInput
            style={[styles.input, editingDriverSpotsError ? styles.inputError : null]}
            value={editingDriverSpots}
            onChangeText={(text) => {
              setEditingDriverSpots(text.replace(/[^0-9]/g, ''));
              setEditingDriverSpotsError('');
            }}
            keyboardType="numeric"
            placeholder="Number of spots"
            maxLength={2}
          />
          {editingDriverSpotsError ? <CustomText style={styles.errorText}>{editingDriverSpotsError}</CustomText> : null}

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <CustomText>Cancel</CustomText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <CustomText style={styles.submitText}>Save</CustomText>
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