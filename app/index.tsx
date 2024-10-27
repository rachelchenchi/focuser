import { Image, StyleSheet, Platform } from 'react-native';
import React from 'react'; // 添加 React 导入解决 UMD global 错误

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Focuser</ThemedText>
        <ThemedText type="subtitle">Focus Together, Stay Healthy</ThemedText>
      </ThemedView>

      <ThemedView style={styles.cardsContainer}>
        {/* Buddy Doubling Card */}
        <TouchableOpacity style={styles.card}>
          <ThemedView style={styles.cardContent}>
            <ThemedText type="subtitle">Buddy Doubling</ThemedText>
            <ThemedText>
              Match with a focus partner and earn coins together! Choose your work time and find a buddy.
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>

        {/* Medication Records Card */}
        <TouchableOpacity style={styles.card}>
          <ThemedView style={styles.cardContent}>
            <ThemedText type="subtitle">Medication Records</ThemedText>
            <ThemedText>
              Track your medications, set reminders, and maintain your health schedule.
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
    gap: 8,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardContent: {
    padding: 16,
    gap: 8,
  },
});
