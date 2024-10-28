import { Stack } from "expo-router";

export default function RootLayout() {
  return (
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
          title: 'Focus Session'
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
  );
}
