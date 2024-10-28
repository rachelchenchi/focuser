import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function FocusScreen() {
    const params = useLocalSearchParams();
    const totalTime = Number(params.time) * 60; // Convert to seconds
    const [timeLeft, setTimeLeft] = useState(totalTime);
    const [isActive, setIsActive] = useState(false);
    const [hasCompleted, setHasCompleted] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => {
                    if (time <= 1) {
                        setIsActive(false);
                        setHasCompleted(true);
                        handleCompletion();
                        return 0;
                    }
                    return time - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleCompletion = () => {
        Alert.alert(
            'Congratulations!',
            'You\'ve earned 50 coins for completing your focus session!',
            [
                {
                    text: 'OK',
                    onPress: () => router.replace('/')
                }
            ]
        );
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const giveUp = () => {
        Alert.alert(
            'Give Up',
            'Are you sure you want to end this session?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Yes',
                    style: 'destructive',
                    onPress: () => router.back()
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.timer}>{formatTime(timeLeft)}</Text>

            {!hasCompleted && (
                <>
                    <TouchableOpacity
                        style={[styles.button, styles.startButton]}
                        onPress={toggleTimer}
                    >
                        <Text style={styles.buttonText}>
                            {isActive ? 'Pause' : 'Start'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.giveUpButton]}
                        onPress={giveUp}
                    >
                        <Text style={[styles.buttonText, styles.giveUpText]}>
                            Give Up
                        </Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    timer: {
        fontSize: 72,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    button: {
        padding: 15,
        borderRadius: 8,
        width: 200,
        alignItems: 'center',
        marginVertical: 10,
    },
    startButton: {
        backgroundColor: '#007AFF',
    },
    giveUpButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    giveUpText: {
        color: '#FF3B30',
    },
});
