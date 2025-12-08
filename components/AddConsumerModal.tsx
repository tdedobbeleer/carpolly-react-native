import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import CustomText from './CustomText';
import { ValidationService } from '../services/validationService';
import type { Consumer } from '../models/consumer.model';

interface AddConsumerModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (consumer: Consumer) => Promise<boolean>;
}

export default function AddConsumerModal({ visible, onClose, onSubmit }: AddConsumerModalProps) {
  const [consumerName, setConsumerName] = useState('');
  const [consumerComments, setConsumerComments] = useState('');
  const [consumerNameError, setConsumerNameError] = useState('');

  useEffect(() => {
    if (visible) {
      setConsumerName('');
      setConsumerComments('');
      setConsumerNameError('');
    }
  }, [visible]);

  const resetConsumerErrors = () => {
    setConsumerNameError('');
  };

  const handleSubmit = async () => {
    if (!ValidationService.checkRateLimit('addConsumer', 10, 60000)) {
      ValidationService.showRateLimitModal('add consumer', 10, 60000);
      onClose();
      return;
    }

    const validation = ValidationService.validateConsumerForm(consumerName, consumerComments);

    setConsumerNameError(validation.errors.name || '');

    if (!validation.isValid) return;

    const consumer: Consumer = {
      name: consumerName,
      comments: consumerComments || undefined
    };

    // Fire the submit operation asynchronously - errors will be handled by toasts
    onSubmit(consumer);

    // Reset form and close modal immediately after validation
    setConsumerName('');
    setConsumerComments('');
    resetConsumerErrors();
    onClose();
  };

  const handleClose = () => {
    resetConsumerErrors();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <CustomText type="h2" style={styles.modalTitle}>Join as Passenger</CustomText>

          <CustomText style={styles.label}>Your Name:</CustomText>
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
          {consumerNameError ? <CustomText style={styles.errorText}>{consumerNameError}</CustomText> : null}

          <CustomText style={styles.label}>Comments (optional):</CustomText>
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
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <CustomText>Cancel</CustomText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <CustomText style={styles.submitText}>Join Ride</CustomText>
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