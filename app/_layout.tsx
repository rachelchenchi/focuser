import { Stack } from 'expo-router';
import { AuthProvider } from "./contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="welcome"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="buddy"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="focus"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: false
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
