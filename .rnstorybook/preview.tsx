import type { Preview } from '@storybook/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider, View } from 'tamagui';
import { tamaguiConfig } from '../tamagui.config';

const preview: Preview = {
  decorators: [
    (Story) => (
      <SafeAreaProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <View flex={1} padding={16} backgroundColor="white">
            <Story />
          </View>
        </TamaguiProvider>
      </SafeAreaProvider>
    ),
  ],
};

export default preview;
