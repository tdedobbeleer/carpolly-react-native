import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Image, Linking } from 'react-native';
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

export default function AboutScreen() {
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
          <CustomText type="h1" style={styles.title}>About CarPolly</CustomText>

          <View style={styles.card}>
            <CustomText style={styles.text}>
              CarPolly is a fun and easy way to organize carpools for events. Whether you're planning a trip to the ice rink, a concert, or any group outing, Carpollies helps you coordinate rides with your friends and fellow "parrots".
            </CustomText>

            <CustomText style={styles.text}>
              Inspired by the social nature of parrots, CarPolly makes sharing rides as natural as a flock taking flight together. Create your event, share the link, and let everyone join as drivers or passengers. It's that simple!
            </CustomText>

            <CustomText style={styles.text}>
              Our mission is to make group transportation hassle-free, so you can focus on enjoying the event rather than worrying about logistics.
            </CustomText>

            <CustomText style={styles.text}>
              And finally: if you're interested in parrots, especially the parrot in this site, please check this video on YouTube. It will enlighten you.
            </CustomText>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.youtube.com/watch?v=4vuW6tQ0218')} style={styles.videoLink}>
              <CustomText style={styles.link}>https://www.youtube.com/watch?v=4vuW6tQ0218</CustomText>
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
  card: {
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
    padding: 20,
    borderRadius: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 10,
    marginTop: 15,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
  },
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  parrotDecoration: {
    width: 100,
    height: 100,
    marginTop: -45,
    opacity: 0.8,
  },
  link: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  videoLink: {
    marginBottom: 10,
  },
});