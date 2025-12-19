import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import CustomText from './CustomText';
import type { Consumer } from '../models/consumer.model';
import { scheduleOnRN } from 'react-native-worklets';

interface PassengersListProps {
  consumers: Consumer[];
  expandedComments: { [key: string]: boolean };
  draggedConsumer: Consumer | null;
  onDragStart: (consumer: Consumer) => void;
  onDragEnd: () => void;
  onToggleComments: (consumerId: string) => void;
  onDeleteConsumer: (consumerId: string) => void;
  dragOverDriver: string | null;
  onDrop: (driverId: string) => void;
  driverPositions: { [driverId: string]: { x: number, y: number, width: number, height: number } };
  onDragOver: (driverId: string | null) => void;
}

interface DraggableConsumerProps {
  consumer: Consumer;
  index: number;
  isDragged: boolean;
  isDragging: boolean;
  expandedComments: { [key: string]: boolean };
  onToggleComments: (consumerId: string) => void;
  onDeleteConsumer: (consumerId: string) => void;
  onDragStart: (consumer: Consumer) => void;
  onDragEnd: () => void;
  dragOverDriver: string | null;
  onDrop: (driverId: string) => void;
  driverPositions: { [driverId: string]: { x: number, y: number, width: number, height: number } };
  onDragOver: (driverId: string | null) => void;
}

const DraggableConsumer: React.FC<DraggableConsumerProps> = ({
  consumer,
  isDragged,
  isDragging,
  expandedComments,
  onToggleComments,
  onDeleteConsumer,
  onDragStart,
  onDragEnd,
  onDrop,
  driverPositions,
  onDragOver,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const currentOverDriver = useSharedValue<string | null>(null);
  const wasDropped = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      scale.value = withTiming(1.05);
      opacity.value = withTiming(0.8);
      scheduleOnRN(onDragStart, consumer);
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      // Check if over driver
      const absX = event.absoluteX;
      const absY = event.absoluteY;
      let overDriver: string | null = null;
      for (const driverId in driverPositions) {
        const pos = driverPositions[driverId];
        if (absX >= pos.x && absX <= pos.x + pos.width && absY >= pos.y && absY <= pos.y + pos.height) {
          overDriver = driverId;
          break;
        }
      }
      if (overDriver !== currentOverDriver.value) {
        currentOverDriver.value = overDriver;
        scheduleOnRN(onDragOver, overDriver);
      }
    })
    .onEnd(() => {
      'worklet';
      if (currentOverDriver.value) {
        wasDropped.value = true;
        scale.value = 1;
        opacity.value = 1;
        scheduleOnRN(onDrop, currentOverDriver.value);
      } else {
        wasDropped.value = false;
        // Animate back to original position
        translateX.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(1, { duration: 300 });
        opacity.value = withTiming(1, { duration: 300 });
        scheduleOnRN(onDragEnd);
      }
    })
    .onFinalize(() => {
      'worklet';
      if (!wasDropped.value) {
        // Animate back to original position
        translateX.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(1, { duration: 300 });
        opacity.value = withTiming(1, { duration: 300 });
      }
      currentOverDriver.value = null;
      wasDropped.value = false;
      scheduleOnRN(onDragOver, null);
      scheduleOnRN(onDragEnd);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
      zIndex: isDragging ? 999 : 0,
      elevation: isDragging ? 10 : 0,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[animatedStyle]}>
        <View
          style={[
            styles.passengerItem,
            isDragging && styles.dragging,
            isDragged && styles.dragged,
          ]}
        >
          <View style={styles.passengerInfo}>
            <CustomText style={[styles.passengerName, isDragging && styles.draggingText]}>
              {consumer.name}
            </CustomText>
            <View style={styles.passengerActions}>
              {consumer.comments && (
                <TouchableOpacity
                  onPress={() => onToggleComments(consumer.id!)}
                  style={styles.actionButton}
                >
                  <Ionicons name="chatbubble" size={16} color="black" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => consumer.id && onDeleteConsumer(consumer.id)}
                style={styles.actionButton}
              >
                <Ionicons name="trash" size={16} color="black" />
              </TouchableOpacity>
            </View>
          </View>
          {expandedComments[consumer.id!] && consumer.comments && (
            <View style={styles.commentContainer}>
              <CustomText style={styles.commentText}>{consumer.comments}</CustomText>
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const PassengersList: React.FC<PassengersListProps> = ({
  consumers,
  expandedComments,
  draggedConsumer,
  onDragStart,
  onDragEnd,
  onToggleComments,
  onDeleteConsumer,
  dragOverDriver,
  onDrop,
  driverPositions,
  onDragOver,
}) => {
  if (!consumers || consumers.length === 0) {
    return null;
  }

  const renderPassengers = () => {
    return consumers.map((consumer, index) => {
      const isDragging = draggedConsumer?.id === consumer.id;
      const isDragged = !!draggedConsumer && draggedConsumer.id !== consumer.id;

      return (
        <DraggableConsumer
          key={consumer.id || index}
          consumer={consumer}
          index={index}
          isDragged={isDragged}
          isDragging={isDragging}
          expandedComments={expandedComments}
          onToggleComments={onToggleComments}
          onDeleteConsumer={onDeleteConsumer}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          dragOverDriver={dragOverDriver}
          onDrop={onDrop}
          driverPositions={driverPositions}
          onDragOver={onDragOver}
        />
      );
    });
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <CustomText type="h2" style={styles.title}>
          Passengers waiting for a ride
        </CustomText>
      </View>
      <View style={styles.passengersList}>
        {renderPassengers()}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    color: '#fff',
  },
  passengersList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
  },
  passengerItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 5,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  passengerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passengerName: {
    fontSize: 16,
    fontWeight: 'normal',
    flex: 1,
  },
  passengerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 5,
    marginLeft: 5,
  },
  commentContainer: {
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderRadius: 4,
    marginTop: 5,
    marginLeft: 10,
  },
  commentText: {
    fontSize: 14,
    color: '#666',
  },
  dragging: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  dragged: {
    opacity: 0.5,
  },
  draggingText: {
    fontWeight: 'bold',
  },
});

export default PassengersList;