import { Stack } from 'expo-router';

export default function CustomerStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CList" options={{ title: "CustomerList" }} />
      <Stack.Screen name="CDetail" options={{ title: "CustomerDetail" }} />
      <Stack.Screen name="CForm" options={{ title: "CustomerDetail" }} />
    </Stack>
  );
}