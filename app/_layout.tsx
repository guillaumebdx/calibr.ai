import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DebugProvider } from '../src/context/DebugContext';
import { SaveProvider } from '../src/context/SaveContext';
import { i18nPromise } from '../src/i18n';

export default function RootLayout() {
  const [isI18nReady, setIsI18nReady] = useState(false);

  useEffect(() => {
    i18nPromise.then(() => setIsI18nReady(true));
  }, []);

  if (!isI18nReady) {
    return null;
  }

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
