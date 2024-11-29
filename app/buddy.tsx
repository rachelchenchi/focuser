import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import socketService from './services/socket';
import { AlertModal } from './components/AlertModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useAuth } from './contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const FOCUS_TIMES = [
    { label: '30 seconds (Debug)', value: 0.5 },
    { label: '25 minutes', value: 25 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '60 minutes', value: 60 }
];

const MODE_OPTIONS = [
    { label: 'Find a Buddy', value: 'buddy' },
    { label: 'Work Alone', value: 'solo' },
    { label: 'Invite Friend', value: 'friend' }
];

export default function BuddyScreen() {
    const [selectedTime, setSelectedTime] = useState(25);
    const [mode, setMode] = useState('buddy');
    const [isSearching, setIsSearching] = useState(false);
    const [timeoutCount, setTimeoutCount] = useState(30);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        buttons: { text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
    }>({
        visible: false,
        title: '',
        message: '',
        buttons: []
    });
    const { user } = useAuth();

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isSearching && timeoutCount > 0) {
            timer = setInterval(() => {
                setTimeoutCount(prev => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isSearching, timeoutCount]);

    useEffect(() => {
        socketService.connect();
        return () => {
            setIsSearching(false);
            socketService.disconnect();
        };
    }, []);

    const resetSearch = () => {
        setIsSearching(false);
        setTimeoutCount(30);
    };

    const showAlert = (config: typeof alertConfig) => {
        setAlertConfig({ ...config, visible: true });
    };

    const handleStart = () => {
        if (mode === 'buddy' && user) {
            setIsSearching(true);
            setTimeoutCount(30);
            console.log('Starting match search...');

            socketService.startMatching(selectedTime, user.username, {
                onMatch: (partnerId, partnerUsername) => {
                    console.log('Match found:', partnerId, partnerUsername);
                    resetSearch();
                    showAlert({
                        visible: true,
                        title: 'Match Found!',
                        message: `You've been matched with ${partnerUsername}!`,
                        buttons: [{
                            text: 'Start',
                            onPress: () => {
                                setAlertConfig(prev => ({ ...prev, visible: false }));
                                router.push({
                                    pathname: '/focus',
                                    params: {
                                        time: selectedTime,
                                        mode: mode,
                                        partnerId,
                                        partnerUsername
                                    }
                                });
                            }
                        }]
                    });
                },
                onTimeout: () => {
                    console.log('Match timeout received');
                    resetSearch();
                    showAlert({
                        visible: true,
                        title: 'No Match Found',
                        message: 'Would you like to start a solo session instead?',
                        buttons: [
                            {
                                text: 'Cancel',
                                style: 'cancel',
                                onPress: () => {
                                    setAlertConfig(prev => ({ ...prev, visible: false }));
                                }
                            },
                            {
                                text: 'Start Solo',
                                onPress: () => {
                                    setAlertConfig(prev => ({ ...prev, visible: false }));
                                    setMode('solo');
                                    router.push({
                                        pathname: '/focus',
                                        params: {
                                            time: selectedTime,
                                            mode: 'solo'
                                        }
                                    });
                                }
                            }
                        ]
                    });
                }
            });
        } else {
            router.push({
                pathname: '/focus',
                params: { time: selectedTime, mode: mode }
            });
        }
    };

    const handleCancel = () => {
        showAlert({
            visible: true,
            title: 'Cancel Search',
            message: 'Are you sure you want to cancel the search?',
            buttons: [
                {
                    text: 'No',
                    style: 'cancel',
                    onPress: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                },
                {
                    text: 'Yes',
                    style: 'destructive',
                    onPress: () => {
                        setAlertConfig(prev => ({ ...prev, visible: false }));
                        resetSearch();
                        router.back();
                    }
                }
            ]
        });
    };

    const handleTimeout = () => {
        console.log('Timeout handler called');
        setIsSearching(false);
        setTimeoutCount(30);
        showAlert({
            visible: true,
            title: 'No Match Found',
            message: 'Would you like to start a solo session instead?',
            buttons: [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        setAlertConfig(prev => ({ ...prev, visible: false }));
                        setIsSearching(false);
                    }
                },
                {
                    text: 'Start Solo',
                    onPress: () => {
                        setAlertConfig(prev => ({ ...prev, visible: false }));
                        setMode('solo');
                        router.push({
                            pathname: '/focus',
                            params: {
                                time: selectedTime,
                                mode: 'solo'
                            }
                        });
                    }
                }
            ]
        });
    };

    useEffect(() => {
        if (isSearching && timeoutCount === 0) {
            handleTimeout();
        }
    }, [timeoutCount, isSearching]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.logo}>FOCUSER</Text>
                <TouchableOpacity style={styles.profileButton}>
                    <Ionicons name="person-circle-outline" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.pageTitle}>Study with buddy</Text>

                <View style={styles.timeSection}>
                    <Text style={styles.sectionTitle}>Set study time:</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedTime}
                            onValueChange={setSelectedTime}
                            style={styles.picker}
                        >
                            {FOCUS_TIMES.map(time => (
                                <Picker.Item
                                    key={time.value}
                                    label={time.label}
                                    value={time.value}
                                    color="#333"
                                />
                            ))}
                        </Picker>
                    </View>
                </View>

                {isSearching ? (
                    <View style={styles.searchingContainer}>
                        <LoadingSpinner size={50} color="#D4D41A" />
                        <Text style={styles.searchingText}>
                            Looking for a buddy...
                        </Text>
                        <Text style={styles.timeoutText}>
                            {`Timeout in ${timeoutCount} seconds`}
                        </Text>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.matchButton]}
                            onPress={() => handleStart()}
                        >
                            <Text style={styles.buttonText}>Match a Random Buddy</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.soloButton]}
                            onPress={() => {
                                setMode('solo');
                                handleStart();
                            }}
                        >
                            <Text style={styles.buttonText}>Study Alone</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
        padding: 16,
    },
    backButton: {
        padding: 8,
    },
    logo: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#D4D41A',
    },
    profileButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    pageTitle: {
        fontSize: 24,
        color: '#666',
        marginBottom: 40,
    },
    timeSection: {
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    pickerContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginTop: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    picker: {
        height: 50,
    },
    buttonsContainer: {
        gap: 16,
    },
    button: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    matchButton: {
        backgroundColor: '#D4D41A',
    },
    soloButton: {
        backgroundColor: '#D4D41A',
        opacity: 0.8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    searchingContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    searchingText: {
        fontSize: 16,
        color: '#D4D41A',
        marginTop: 16,
    },
    timeoutText: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
    },
    cancelButton: {
        marginTop: 24,
        padding: 12,
    },
    cancelButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
});
