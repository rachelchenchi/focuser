import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from './contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './theme/colors';

export default function ProfileScreen() {
    const { user, userStats, logout } = useAuth();

    const formatFocusTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        return `${hours}h`;
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/welcome');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.push('/home')}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.profileSection}>
                <Image
                    source={require('../assets/avatar2.png')}
                    style={styles.avatar}
                />
                <Text style={styles.username}>{user?.username}</Text>
            </View>

            <View style={styles.statsSection}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{userStats.activeMeds}</Text>
                    <Text style={styles.statLabel}>Active Meds</Text>
                    {/* Button to navigate to Meds Manager */}
                    <TouchableOpacity onPress={() => router.push('/meds')}>
                        <Text style={styles.manageMedsButton}>Manage Medications</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{userStats.totalSessions}</Text>
                    <Text style={styles.statLabel}>Total Sessions</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {formatFocusTime(userStats.totalFocusTime)}
                    </Text>
                    <Text style={styles.statLabel}>Focus Time</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{userStats.coins}</Text>
                    <Text style={styles.statLabel}>Coins</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
            >
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    profileSection: {
        alignItems: 'center',
        marginTop: 40,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    statsSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 40,
        paddingHorizontal: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#D4D41A',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    logoutButton: {
        backgroundColor: '#FFB8B8',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
    },
    logoutText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
    manageMedsButton: {
        marginTop: theme.spacing.sm,
        fontSize: 14,
        backgroundColor: '#4CAF50', // Match Meds card color
        color: 'white',
        fontWeight: 'bold',
        padding: 6,
        borderRadius: 12,
    },    
}); 