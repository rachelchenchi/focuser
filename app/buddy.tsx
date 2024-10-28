import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import socketService from './services/socket';
import { AlertModal } from './components/AlertModal';

const FOCUS_TIMES = [
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

    useEffect(() => {
        socketService.connect();
        return () => {
            setIsSearching(false);
            socketService.disconnect();
        };
    }, []);

    const showAlert = (config: typeof alertConfig) => {
        setAlertConfig({ ...config, visible: true });
    };

    const handleStart = () => {
        if (mode === 'buddy') {
            setIsSearching(true);
            console.log('Starting match search...');

            socketService.startMatching(selectedTime, {
                onMatch: (partnerId) => {
                    console.log('Match found:', partnerId);
                    setIsSearching(false);
                    showAlert({
                        visible: true,
                        title: 'Match Found!',
                        message: 'A buddy has been found. Starting session...',
                        buttons: [{
                            text: 'OK',
                            onPress: () => {
                                setAlertConfig(prev => ({ ...prev, visible: false }));
                                router.push({
                                    pathname: '/focus',
                                    params: {
                                        time: selectedTime,
                                        mode: mode,
                                        partnerId
                                    }
                                });
                            }
                        }]
                    });
                },
                onTimeout: () => {
                    console.log('Match timeout received');
                    setIsSearching(false);
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
                }
            });
        } else {
            router.push({
                pathname: '/focus',
                params: { time: selectedTime, mode: mode }
            });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Focus Session Setup</Text>

            <View style={styles.pickerContainer}>
                <Text style={styles.label}>Select Focus Time:</Text>
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
                        />
                    ))}
                </Picker>
            </View>

            <View style={styles.pickerContainer}>
                <Text style={styles.label}>Select Mode:</Text>
                <Picker
                    selectedValue={mode}
                    onValueChange={setMode}
                    style={styles.picker}
                >
                    {MODE_OPTIONS.map(option => (
                        <Picker.Item
                            key={option.value}
                            label={option.label}
                            value={option.value}
                        />
                    ))}
                </Picker>
            </View>

            <TouchableOpacity
                style={[styles.button, isSearching && styles.buttonDisabled]}
                onPress={handleStart}
                disabled={isSearching}
            >
                <Text style={styles.buttonText}>
                    {isSearching ? 'Searching...' : 'Start Session'}
                </Text>
            </TouchableOpacity>

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
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
    },
    pickerContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    picker: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
