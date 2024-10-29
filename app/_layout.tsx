import { Stack } from "expo-router";
import { AuthProvider } from "./contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Home'
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: 'Login'
          }}
        />
        <Stack.Screen
          name="buddy"
          options={{
            title: 'Focus Session',
            headerBackVisible: true
          }}
        />
        <Stack.Screen
          name="focus"
          options={{
            title: 'Focus Timer',
            headerBackVisible: false
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
