import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface LoadingSpinnerProps {
    size?: number;
    color?: string;
}

export function LoadingSpinner({ size = 40, color = '#007AFF' }: LoadingSpinnerProps) {
    const spinValue = new Animated.Value(0);

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.spinner,
                    {
                        width: size,
                        height: size,
                        borderColor: color,
                        transform: [{ rotate: spin }]
                    }
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    spinner: {
        borderWidth: 3,
        borderRadius: 50,
        borderTopColor: 'transparent',
    },
}); 