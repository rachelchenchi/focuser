import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AlertModal } from './components/AlertModal';
import { useAuth } from './contexts/AuthContext';
import socketService from './services/socket';
import { calculateReward, updateUserCoins, getUserCoins } from './services/rewards';
import { theme } from './theme/colors';

export default function FocusScreen() {
    const params = useLocalSearchParams();
    const { user, token, setUserStats } = useAuth();
    const totalTime = Number(params.time) * 60;
    const [timeLeft, setTimeLeft] = useState(totalTime);
    const [isActive, setIsActive] = useState(false);
    const [hasCompleted, setHasCompleted] = useState(false);
    const mode = params.mode as string;
    const partnerId = params.partnerId as string;
    const partnerUsername = params.partnerUsername as string;
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        showCoin?: boolean;
        buttons: Array<{
            text: string;
            style?: 'default' | 'cancel' | 'destructive';
            onPress: () => void;
        }>;
    }>({
        visible: false,
        title: '',
        message: '',
        buttons: []
    });
    const [partnerLeft, setPartnerLeft] = useState(false);
    const [coins, setCoins] = useState(0);
    const [partnerCompleted, setPartnerCompleted] = useState(false);

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
                    if (!partnerCompleted && !hasCompleted) {
                        console.log('onPartnerLeave triggered. partnerCompleted not true');
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
                                        handleGiveUp();
                                    }
                                }
                            ]
                        });
                    }
                },
                onPartnerComplete: () => {
                    console.log('Partner Complete Event Triggered');
                    setPartnerCompleted(true);
                    showAlert({
                        visible: true,
                        title: 'Partner Completed',
                        message: 'Your focus buddy has completed their session! Keep going to earn the buddy bonus!',
                        buttons: [
                            {
                                text: 'OK',
                                onPress: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                            }
                        ]
                    });
                }
            });
        }

        return () => {
            if (mode === 'buddy' && partnerId) {
                console.log('Cleanup function triggered:', {
                    hasCompleted,
                    partnerCompleted
                });

                setTimeout(() => {
                    if (!hasCompleted) {
                        socketService.notifyLeaving(partnerId);
                        console.log('notifyLeaving triggered');
                    } else {
                        socketService.notifyCompletion(partnerId);
                        console.log('notifyCompletion triggered');
                    }
                    socketService.disconnect();
                }, 100);
            }
        };
    }, [mode, partnerId, hasCompleted, partnerCompleted]);

    useEffect(() => {
        const loadCoins = async () => {
            if (token) {
                try {
                    const userCoins = await getUserCoins(token);
                    setCoins(userCoins);
                } catch (error) {
                    console.error('Failed to load coins:', error);
                }
            }
        };
        loadCoins();
    }, [token]);

    const handleCompletion = async () => {
        setHasCompleted(true);
        const reward = calculateReward(
            totalTime,
            mode === 'buddy',
            true,
            partnerLeft && !partnerCompleted
        );

        try {
            if (token) {
                const updatedCoins = await updateUserCoins(token, reward.points);
                setCoins(updatedCoins);

                await fetch('http://localhost:5000/api/focus/complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        focusTime: totalTime / 60
                    })
                });

                const statsResponse = await fetch('http://localhost:5000/api/user/stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const statsData = await statsResponse.json();
                setUserStats(statsData);
            }

            if (mode === 'buddy' && partnerId) {
                socketService.notifyCompletion(partnerId);
            }

            showAlert({
                visible: true,
                title: reward.type === 'success' ? 'Congratulations!' :
                    reward.type === 'partner_left' ? 'Session Complete' : 'Session Complete',
                message: reward.message,
                showCoin: true,
                buttons: [
                    {
                        text: 'Back to Home',
                        onPress: () => {
                            setAlertConfig(prev => ({ ...prev, visible: false }));
                            router.replace('/home');
                        }
                    }
                ]
            });
        } catch (error) {
            console.error('Failed to update stats:', error);
            showAlert({
                visible: true,
                title: 'Error',
                message: 'Failed to update stats. Please try again.',
                buttons: [
                    {
                        text: 'OK',
                        onPress: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                    }
                ]
            });
        }
    };

    const showAlert = (config: typeof alertConfig) => {
        setAlertConfig({ ...config, visible: true });
    };

    const handleGiveUp = async () => {
        const reward = calculateReward(
            totalTime,
            mode === 'buddy',
            false,
            partnerLeft
        );

        showAlert({
            visible: true,
            title: 'Give Up',
            message: `Are you sure you want to end this session? ${reward.message}`,
            buttons: [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                },
                {
                    text: 'Give Up',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (token) {
                                const updatedCoins = await updateUserCoins(token, reward.points);
                                setCoins(updatedCoins);
                            }
                            setAlertConfig(prev => ({ ...prev, visible: false }));
                            router.replace('/home');
                        } catch (error) {
                            console.error('Failed to update coins:', error);
                            showAlert({
                                visible: true,
                                title: 'Error',
                                message: 'Failed to update coins. Please try again.',
                                buttons: [
                                    {
                                        text: 'OK',
                                        onPress: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                                    }
                                ]
                            });
                        }
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
            <View style={styles.buddyContainer}>
                {mode === 'buddy' ? (
                    <View style={styles.avatarContainer}>
                        <View style={styles.userStatus}>
                            <Image
                                source={require('../assets/avatar1.png')}
                                style={styles.avatar}
                            />
                            <View style={[
                                styles.onlineIndicator,
                                partnerLeft && styles.offlineIndicator
                            ]} />
                            <Text style={styles.userName}>{partnerUsername}</Text>
                        </View>
                        <View style={styles.userStatus}>
                            <Image
                                source={require('../assets/avatar2.png')}
                                style={styles.avatar}
                            />
                            <View style={styles.onlineIndicator} />
                            <Text style={styles.userName}>Me</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.soloContainer}>
                        <Image
                            source={require('../assets/avatar2.png')}
                            style={styles.avatar}
                        />
                        <View style={styles.onlineIndicator} />
                        <Text style={styles.userName}>Me</Text>
                    </View>
                )}
            </View>

            <Text style={styles.timer}>{formatTime(timeLeft)}</Text>

            <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.pauseButton]}
                    onPress={toggleTimer}
                >
                    <Text style={styles.buttonText}>
                        {isActive ? 'Pause' : 'Start'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.quitButton]}
                    onPress={handleGiveUp}
                >
                    <Text style={[styles.buttonText, styles.quitButtonText]}>
                        Quit
                    </Text>
                </TouchableOpacity>
            </View>

            <AlertModal
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                showCoin={alertConfig.showCoin}
                buttons={alertConfig.buttons}
            />

            <View style={styles.coinsContainer}>
                <Text style={styles.coinsText}>
                    Current Coins: {coins}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFEF2',
        justifyContent: 'space-between',
        padding: 20,
    },
    buddyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    avatarContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 60,
    },
    userStatus: {
        alignItems: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 8,
    },
    onlineIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#34C759',
        position: 'absolute',
        bottom: 45,
        right: 0,
    },
    offlineIndicator: {
        backgroundColor: '#8E8E93',
    },
    userName: {
        fontSize: 16,
        color: '#333',
    },
    timer: {
        fontSize: 72,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
        position: 'absolute',
        left: 0,
        right: 0,
        top: '45%',
        transform: [{ translateY: -36 }],
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 40,
    },
    button: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pauseButton: {
        backgroundColor: '#D4D41A',
    },
    quitButton: {
        backgroundColor: '#FFB8B8',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    quitButtonText: {
        color: '#FF3B30',
    },
    coinsContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: '#FFD700',
        padding: 10,
        borderRadius: 15,
    },
    coinsText: {
        fontWeight: 'bold',
        color: '#000',
    },
    soloContainer: {
        alignItems: 'center',
    },

});
