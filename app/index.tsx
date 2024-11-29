import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Image } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from './contexts/AuthContext';
import { AlertModal } from './components/AlertModal';
import { theme } from './theme/colors';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = () => {
  const { isAuthenticated, user } = useAuth();
  const [alertVisible, setAlertVisible] = React.useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.logo}>FOCUSER</Text>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Welcome Message */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>
          Good {getTimeOfDay()},
        </Text>
        <Text style={styles.userName}>
          {user?.username || 'Guest'} <Text style={styles.emoji}>☀️</Text>
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.studyCard}
          onPress={() => isAuthenticated ? router.push('/buddy') : setAlertVisible(true)}
        >
          <View style={styles.cardContent}>
            <Ionicons name="people" size={24} color="white" />
            <Text style={styles.cardText}>study with a buddy...</Text>
            <Ionicons name="arrow-forward" size={24} color="white" />
          </View>
        </TouchableOpacity>

        {!isAuthenticated && (
          <Link href="/login" asChild>
            <TouchableOpacity style={styles.loginButton}>
              <Text style={styles.loginButtonText}>Login to Start</Text>
            </TouchableOpacity>
          </Link>
        )}
      </View>

      <AlertModal
        visible={alertVisible}
        title="Login Required"
        message="Please login to start a focus session"
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setAlertVisible(false)
          },
          {
            text: 'Login',
            onPress: () => {
              setAlertVisible(false);
              router.push('/login');
            }
          }
        ]}
      />
    </SafeAreaView>
  );
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFEF2', // Light yellow background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  menuButton: {
    padding: theme.spacing.sm,
  },
  profileButton: {
    padding: theme.spacing.sm,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4D41A', // Yellow color for logo
  },
  welcomeSection: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xl * 2,
  },
  welcomeText: {
    fontSize: 28,
    color: '#333',
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D4D41A',
    marginTop: theme.spacing.sm,
  },
  emoji: {
    fontSize: 28,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  studyCard: {
    backgroundColor: '#D4D41A',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  loginButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
