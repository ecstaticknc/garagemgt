import { Stack } from 'expo-router';

export default function ServiceHistoryStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SCList" options={{ title: "Service List" }} />
      <Stack.Screen name="SCForm" options={{ title: "Service form" }} />
    </Stack>
  );
}