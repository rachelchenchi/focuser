import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface AlertModalProps {
    visible: boolean;
    title: string;
    message: string;
    buttons: {
        text: string;
        onPress: () => void;
        style?: 'default' | 'cancel' | 'destructive';
    }[];
}

export function AlertModal({ visible, title, message, buttons }: AlertModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => {
                const cancelButton = buttons.find(b => b.style === 'cancel');
                if (cancelButton) {
                    cancelButton.onPress();
                }
            }}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <View style={styles.buttonContainer}>
                        {buttons.map((button, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    button.style === 'cancel' && styles.cancelButton,
                                    button.style === 'destructive' && styles.destructiveButton,
                                ]}
                                onPress={button.onPress}
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        button.style === 'destructive' && styles.destructiveText,
                                    ]}
                                >
                                    {button.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
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
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: Platform.select({ web: 400, default: '80%' }),
        maxWidth: 400,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: Platform.select({ web: 'row', default: 'column' }),
        justifyContent: 'center',
        gap: 10,
    },
    button: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#007AFF',
        minWidth: 100,
    },
    cancelButton: {
        backgroundColor: '#E5E5EA',
    },
    destructiveButton: {
        backgroundColor: '#FF3B30',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
    },
    destructiveText: {
        color: 'white',
    },
}); 