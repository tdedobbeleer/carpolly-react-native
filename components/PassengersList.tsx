import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from './CustomText';
import type { Consumer } from '../models/consumer.model';

interface PassengersListProps {
  consumers: Consumer[];
  expandedComments: { [key: string]: boolean };
  draggedConsumer: Consumer | null;
  onDragStart: (consumer: Consumer) => void;
  onDragEnd: () => void;
  onToggleComments: (consumerId: string) => void;
  onDeleteConsumer: (consumerId: string) => void;
}

export default function PassengersList({
  consumers,
  expandedComments,
  draggedConsumer,
  onDragStart,
  onDragEnd,
  onToggleComments,
  onDeleteConsumer,
}: PassengersListProps) {
  if (!consumers || consumers.length === 0) {
    return null;
  }

  return (
    <View style={{ marginBottom: 20 }}>
      <CustomText type="h2" style={{ fontSize: 18, marginBottom: 10 }}>
        Passengers waiting for a ride
      </CustomText>
      <View style={{ marginBottom: 10 }}>
        {consumers.map((consumer) => (
          <View key={consumer.id}>
            <View
              style={[
                {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 10,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 8,
                  marginBottom: 5,
                },
                draggedConsumer?.id === consumer.id && { opacity: 0.5 }
              ]}
              onTouchStart={() => onDragStart(consumer)}
              onTouchEnd={onDragEnd}
            >
              <CustomText>{consumer.name}</CustomText>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {consumer.comments && (
                  <TouchableOpacity onPress={() => onToggleComments(consumer.id!)}>
                    <Ionicons name="chatbubble" size={16} color="black" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => consumer.id && onDeleteConsumer(consumer.id)}
                  style={{ padding: 5 }}
                >
                  <Ionicons name="trash" size={16} color="black" />
                </TouchableOpacity>
              </View>
            </View>
            {expandedComments[consumer.id!] && consumer.comments && (
              <View style={{
                backgroundColor: '#f0f0f0',
                padding: 5,
                borderRadius: 4,
                marginLeft: 10,
                marginBottom: 5,
              }}>
                <CustomText style={{ fontSize: 14, color: '#666' }}>{consumer.comments}</CustomText>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}