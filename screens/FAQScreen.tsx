import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CustomText from '../components/CustomText';

type RootStackParamList = {
  Home: undefined;
  PollyDetail: { id: string };
  About: undefined;
  FAQ: undefined;
};

export default function FAQScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <LinearGradient
      colors={['#ff7e5f', '#feb47b', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >


      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <CustomText type="h1" style={styles.sectionTitle}>How Carpollies Work</CustomText>

          <View style={styles.stepCard}>
            <CustomText type="h2" style={styles.stepNumber}>1</CustomText>
            <CustomText type="h2" style={styles.stepTitle}>Create a Polly</CustomText>
            <CustomText style={styles.stepDescription}>
              This is an event like: "Going ice skating on Friday the 7th of November."
            </CustomText>
          </View>

          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-down" size={30} color="#fff" />
          </View>

          <View style={styles.stepCard}>
            <CustomText type="h2" style={styles.stepNumber}>2</CustomText>
            <CustomText type="h2" style={styles.stepTitle}>Share the Polly URL</CustomText>
            <CustomText style={styles.stepDescription}>
              Share the Polly URL with potential drivers and other parrots who might need a ride to the event.{'\n\n'}
              Beware: Like parrots, Pollies are public for everyone to see! Anyone with the link can join in.
            </CustomText>
          </View>

          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-down" size={30} color="#fff" />
          </View>

          <View style={styles.stepCard}>
            <CustomText type="h2" style={styles.stepNumber}>3</CustomText>
            <CustomText type="h2" style={styles.stepTitle}>Let Parrots Join</CustomText>
            <CustomText style={styles.stepDescription}>
              Let the parrots add themselves as driver or as passenger.{'\n\n'}
              • As a driver: You can say where you'll be and how many spots you have in your car.{'\n'}
              • As a passenger: You can add some comments like: "I talk all the time, beware."
            </CustomText>
          </View>

          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-down" size={30} color="#fff" />
          </View>

          <View style={styles.stepCard}>
            <CustomText type="h2" style={styles.stepNumber}>4</CustomText>
            <CustomText type="h2" style={styles.stepTitle}>Go to the Event</CustomText>
            <CustomText style={styles.stepDescription}>
              Just go to the event, with all parrots neatly divided over the available cars.
            </CustomText>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 20,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    color: '#fff',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 32,
    textAlign: 'center',
    color: '#fff',
    marginBottom: 30,
  },
  stepCard: {
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
    padding: 20,
    borderRadius: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 48,
    color: '#007bff',
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#555',
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  parrotDecoration: {
    width: 100,
    height: 100,
    marginTop: -40,
    opacity: 0.8,
  },
});