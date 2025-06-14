import { Stack } from 'expo-router';

export default function ServiceHistoryStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SHList" options={{ title: "Service History" }} />
      <Stack.Screen name="SHForm" options={{ title: "Service History Form" }} />
    </Stack>
  );
}