import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import CustomText from './CustomText';

interface EditPollyModalProps {
  visible: boolean;
  description: string;
  onClose: () => void;
  onSubmit: (description: string) => void;
}

export default function EditPollyModal({ visible, description, onClose, onSubmit }: EditPollyModalProps) {
  const [editingDescription, setEditingDescription] = useState(description);

  useEffect(() => {
    if (visible) {
      setEditingDescription(description);
    }
  }, [visible, description]);

  const handleSubmit = () => {
    onSubmit(editingDescription);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <CustomText type="h2" style={styles.modalTitle}>Edit Polly</CustomText>

          <CustomText style={styles.label}>Description</CustomText>
          <TextInput
            style={styles.input}
            value={editingDescription}
            onChangeText={setEditingDescription}
            placeholder="Polly description"
            maxLength={60}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
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