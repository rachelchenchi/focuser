import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import * as authService from './services/auth';
import { useAuth } from './contexts/AuthContext';
import { AlertModal } from './components/AlertModal';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './theme/colors';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        buttons: [{ text: 'OK', onPress: () => { } }]
    });
    const { login: authLogin } = useAuth();

    const showAlert = (title: string, message: string) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            buttons: [{
                text: 'OK',
                onPress: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            }]
        });
    };

    const handleSubmit = async () => {
        if (!username || !password) {
            showAlert('Error', 'Please enter username and password');
            return;
        }

        try {
            setIsLoading(true);
            if (isRegistering) {
                const response = await authService.register(username, password);
                showAlert('Success', 'Registration successful! Please login.');
                setIsRegistering(false);
            } else {
                const response = await authService.login(username, password);
                authLogin(response.token, response.user);
                router.replace('/');
            }
        } catch (error) {
            showAlert('Error', error instanceof Error ? error.message : 'Operation failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.logo}>FOCUSER</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>
                    {isRegistering ? 'Create Account' : 'Welcome Back'}
                    <Text style={styles.emoji}> 👋</Text>
                </Text>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor="#666"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#666"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!isLoading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        <Text style={styles.submitButtonText}>
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
            </View>

            <AlertModal
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFEF2',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        paddingTop: theme.spacing.lg,
    },
    backButton: {
        padding: theme.spacing.sm,
    },
    logo: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#D4D41A',
    },
    placeholder: {
        width: 40, // Same width as back button for alignment
    },
    content: {
        flex: 1,
        padding: theme.spacing.xl,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 40,
    },
    emoji: {
        fontSize: 28,
    },
    form: {
        gap: theme.spacing.lg,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        paddingHorizontal: theme.spacing.md,
        height: 50,
    },
    inputIcon: {
        marginRight: theme.spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    submitButton: {
        backgroundColor: '#D4D41A',
        height: 50,
        borderRadius: theme.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.md,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    switchButton: {
        padding: theme.spacing.md,
        alignItems: 'center',
    },
    switchButtonText: {
        color: '#D4D41A',
        fontSize: 14,
        fontWeight: '600',
    },
});
