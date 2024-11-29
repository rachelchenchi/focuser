import { Stack } from "expo-router";
import { AuthProvider } from "./contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="welcome"
          options={{
            title: 'Welcome'
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: 'Login'
          }}
        />
        <Stack.Screen
          name="index"
          options={{
            title: 'Home'
          }}
        />
        <Stack.Screen
          name="buddy"
          options={{
            title: 'Focus Session',
            headerShown: true,
            headerBackVisible: true
          }}
        />
        <Stack.Screen
          name="focus"
          options={{
            title: 'Focus Timer',
            headerShown: true,
            headerBackVisible: false
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
