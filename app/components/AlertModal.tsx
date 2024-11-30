import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { theme } from '../theme/colors';

interface AlertModalProps {
    visible: boolean;
    title: string;
    message: string;
    showCoin?: boolean;
    buttons: {
        text: string;
        onPress: () => void;
        style?: 'default' | 'cancel' | 'destructive';
    }[];
}

export function AlertModal({ visible, title, message, showCoin, buttons }: AlertModalProps) {
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {showCoin && (
                            <Image
                                source={require('../../assets/coin.png')}
                                style={styles.coinIcon}
                            />
                        )}
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                        <View style={styles.buttonContainer}>
                            {buttons.map((button, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        button.style === 'destructive' && styles.destructiveButton,
                                        button.style === 'cancel' && styles.cancelButton
                                    ]}
                                    onPress={button.onPress}
                                >
                                    <Text style={[
                                        styles.buttonText,
                                        button.style === 'destructive' && styles.destructiveText,
                                        button.style === 'cancel' && styles.cancelText
                                    ]}>
                                        {button.text}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
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
    modalContainer: {
        width: '80%',
        backgroundColor: '#FFFEF2',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalContent: {
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#D4D41A',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonContainer: {
        width: '100%',
        gap: 10,
    },
    button: {
        backgroundColor: '#D4D41A',
        padding: 12,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    destructiveButton: {
        backgroundColor: '#FFB8B8',
    },
    destructiveText: {
        color: '#FF3B30',
    },
    cancelButton: {
        backgroundColor: '#E5E5E5',
    },
    cancelText: {
        color: '#333',
    },
    coinIcon: {
        width: 60,
        height: 60,
        marginBottom: 15,
    },
}); 