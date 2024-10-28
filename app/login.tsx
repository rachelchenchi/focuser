import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Alert } from 'react-native';
import { router } from 'expo-router';
import * as authService from './services/auth';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    const handleSubmit = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter username and password');
            return;
        }

        try {
            setIsLoading(true);
            if (isRegistering) {
                await authService.register(username, password);
                Alert.alert('Success', 'Registration successful! Please login.');
                setIsRegistering(false);
            } else {
                const response = await authService.login(username, password);
                Alert.alert('Success', 'Login successful!');
                router.replace('/');  // Navigate back to home
            }
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Operation failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{isRegistering ? 'Sign Up' : 'Sign In'}</Text>

            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!isLoading}
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
            />

            <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
            >
                <Text style={styles.buttonText}>
                    {isLoading
                        ? 'Processing...'
                        : isRegistering
                            ? 'Sign Up'
                            : 'Sign In'
                    }
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setIsRegistering(!isRegistering)}
                disabled={isLoading}
            >
                <Text style={styles.switchButtonText}>
                    {isRegistering
                        ? 'Already have an account? Sign In'
                        : 'Need an account? Sign Up'
                    }
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    button: {
        backgroundColor: '#007AFF',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    switchButton: {
        marginTop: 20,
        padding: 10,
    },
    switchButtonText: {
        color: '#007AFF',
        textAlign: 'center',
    },
});
