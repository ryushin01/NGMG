import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Toaster } from 'sonner-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '../../tamagui.config';
import { connectQueryManagers, persistOptions, queryClient } from './query-client';

export const Providers = ({ children }: { children: ReactNode }) => {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  useEffect(connectQueryManagers, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme={scheme}>
          <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions as never}>
            {children}
            <Toaster position="top-center" theme={scheme} />
          </PersistQueryClientProvider>
        </TamaguiProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
};
