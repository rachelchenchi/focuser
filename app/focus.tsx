import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AlertModal } from './components/AlertModal';
import { useAuth } from './contexts/AuthContext';
import socketService from './services/socket';

export default function FocusScreen() {
    const params = useLocalSearchParams();
    const { user } = useAuth();
    const totalTime = Number(params.time) * 60;
    const [timeLeft, setTimeLeft] = useState(totalTime);
    const [isActive, setIsActive] = useState(false);
    const [hasCompleted, setHasCompleted] = useState(false);
    const mode = params.mode as string;
    const partnerId = params.partnerId as string;
    const partnerUsername = params.partnerUsername as string;
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        buttons: [] as Array<{
            text: string;
            style?: 'default' | 'cancel' | 'destructive';
            onPress: () => void;
        }>
    });
    const [partnerLeft, setPartnerLeft] = useState(false);

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

    useEffect(() => {
        if (mode === 'buddy' && partnerId) {
            socketService.connect();

            socketService.startMatching(0, '', {
                onMatch: () => { },
                onTimeout: () => { },
                onPartnerLeave: () => {
                    setPartnerLeft(true);
                    showAlert({
                        visible: true,
                        title: 'Partner Left',
                        message: 'Your focus buddy has left the session.',
                        buttons: [
                            {
                                text: 'Continue Solo',
                                onPress: () => {
                                    setAlertConfig(prev => ({ ...prev, visible: false }));
                                }
                            },
                            {
                                text: 'End Session',
                                style: 'destructive',
                                onPress: () => {
                                    setAlertConfig(prev => ({ ...prev, visible: false }));
                                    router.back();
                                }
                            }
                        ]
                    });
                }
            });
        }

        return () => {
            if (mode === 'buddy' && partnerId) {
                socketService.notifyLeaving(partnerId);
                socketService.disconnect();
            }
        };
    }, [mode, partnerId]);

    const handleCompletion = () => {
        showAlert({
            visible: true,
            title: 'Congratulations!',
            message: 'You\'ve earned 50 coins for completing your focus session!',
            buttons: [
                {
                    text: 'Back to Home',
                    onPress: () => {
                        setAlertConfig(prev => ({ ...prev, visible: false }));
                        router.replace('/');
                    }
                }
            ]
        });
    };

    const showAlert = (config: typeof alertConfig) => {
        setAlertConfig({ ...config, visible: true });
    };

    const handleGiveUp = () => {
        showAlert({
            visible: true,
            title: 'Give Up',
            message: 'Are you sure you want to end this session? You won\'t earn any coins.',
            buttons: [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                },
                {
                    text: 'Give Up',
                    style: 'destructive',
                    onPress: () => {
                        setAlertConfig(prev => ({ ...prev, visible: false }));
                        router.back();
                    }
                }
            ]
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    return (
        <View style={styles.container}>
            {mode === 'buddy' && (
                <View style={styles.partnerInfo}>
                    <Text style={styles.partnerText}>
                        {partnerLeft ? 'Continuing Solo' : 'Focusing with:'}
                    </Text>
                    <View style={styles.namesContainer}>
                        <Text style={styles.name}>{user?.username}</Text>
                        {!partnerLeft && (
                            <>
                                <Text style={styles.separator}>+</Text>
                                <Text style={[
                                    styles.name,
                                    partnerLeft && styles.leftPartner
                                ]}>
                                    {partnerUsername}
                                    {partnerLeft && ' (Left)'}
                                </Text>
                            </>
                        )}
                    </View>
                </View>
            )}

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
                        onPress={handleGiveUp}
                    >
                        <Text style={[styles.buttonText, styles.giveUpText]}>
                            Give Up
                        </Text>
                    </TouchableOpacity>
                </>
            )}

            <AlertModal
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
            />
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
    partnerInfo: {
        alignItems: 'center',
        marginBottom: 30,
    },
    partnerText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    namesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    separator: {
        fontSize: 20,
        color: '#666',
    },
    leftPartner: {
        color: '#999',
        textDecorationLine: 'line-through',
    },
});
