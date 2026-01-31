import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DebugProvider } from '../src/context/DebugContext';
import { SaveProvider } from '../src/context/SaveContext';

export default function RootLayout() {
  return (
    <DebugProvider>
      <SaveProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: '#0a0a0f' },
          }}
        />
      </SaveProvider>
    </DebugProvider>
  );
}
