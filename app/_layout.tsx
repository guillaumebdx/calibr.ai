import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DebugProvider } from '../src/context/DebugContext';

export default function RootLayout() {
  return (
    <DebugProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#0a0a0f' },
        }}
      />
    </DebugProvider>
  );
}
