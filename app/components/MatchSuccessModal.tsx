import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme } from '../theme/colors';

interface MatchSuccessModalProps {
    visible: boolean;
    partnerUsername: string;
    onStart: () => void;
}

export function MatchSuccessModal({ visible, partnerUsername, onStart }: MatchSuccessModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Matched with</Text>
                    <Text style={styles.username}>{partnerUsername}!</Text>

                    <View style={styles.avatarsContainer}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={require('../../assets/avatar1.png')}
                                style={styles.avatar}
                            />
                            <Text style={styles.avatarLabel}>{partnerUsername}</Text>
                        </View>

                        <Image
                            source={require('../../assets/arrow.png')}
                            style={styles.arrow}
                        />

                        <View style={styles.avatarWrapper}>
                            <Image
                                source={require('../../assets/avatar2.png')}
                                style={styles.avatar}
                            />
                            <Text style={styles.avatarLabel}>Me</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.startButton} onPress={onStart}>
                        <Text style={styles.startButtonText}>Start Session</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#FFFEF2',
        borderRadius: 20,
        padding: 24,
        width: '80%',
        maxWidth: 400,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        color: '#333',
        marginBottom: 8,
    },
    username: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFB800',
        marginBottom: 32,
    },
    avatarsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 32,
    },
    avatarWrapper: {
        alignItems: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFE4E1',
        marginBottom: 8,
    },
    avatarLabel: {
        fontSize: 16,
        color: '#333',
    },
    arrow: {
        width: 24,
        height: 24,
        tintColor: '#D4D41A',
    },
    startButton: {
        backgroundColor: '#D4D41A',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    startButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 