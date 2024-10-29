import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from './contexts/AuthContext';
import { AlertModal } from './components/AlertModal';

const HomeScreen = () => {
  const { isAuthenticated, user } = useAuth();
  const [alertVisible, setAlertVisible] = React.useState(false);

  const handleFocusPress = () => {
    if (!isAuthenticated) {
      setAlertVisible(true);
      return;
    }
    router.push('/buddy');
  };

  return (
    <View style={styles.container}>
      {isAuthenticated ? (
        <Text style={styles.welcomeText}>Welcome, {user?.username}!</Text>
      ) : (
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </Link>
      )}

      <TouchableOpacity
        style={[styles.button, styles.focusButton]}
        onPress={handleFocusPress}
      >
        <Text style={styles.buttonText}>Start Focus Session</Text>
      </TouchableOpacity>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  welcomeText: {
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    width: 200,
    alignItems: 'center',
  },
  focusButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
