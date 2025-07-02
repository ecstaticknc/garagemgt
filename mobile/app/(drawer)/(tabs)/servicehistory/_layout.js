import { Stack } from 'expo-router';

export default function ServiceHistoryStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SHList" options={{ title: "सेवेचा इतिहास" }} />
      <Stack.Screen name="SHForm" options={{ title: "सेवा इतिहासाचा फॉर्म" }} />
    </Stack>
  );
}