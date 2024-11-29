import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { theme } from './theme/colors';

export default function WelcomeScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Image
                    source={require('../assets/logo.png')} // 需要添加logo图片
                    style={styles.logo}
                />
                <Text style={styles.byText}>By KJ</Text>
                <Text style={styles.title}>FOCUSER</Text>
            </View>

            <TouchableOpacity
                style={styles.startButton}
                onPress={() => router.push('/login')}
            >
                <Text style={styles.startText}>Tap to Begin ...</Text>
                <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFEF2',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 10,
    },
    byText: {
        fontSize: 16,
        color: '#FF9EAA',
        marginBottom: 5,
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#D4D41A',
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D4D41A',
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    startText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    arrow: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
}); 