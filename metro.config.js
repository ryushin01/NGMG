const { getDefaultConfig } = require('expo/metro-config');
const { withStorybook } = require('@storybook/react-native/metro/withStorybook');
const { withTamagui } = require('@tamagui/cli/metro');

const config = withTamagui(getDefaultConfig(__dirname), {
  components: ['tamagui'],
  config: './tamagui.config.ts',
});

module.exports = withStorybook(config, {
  enabled: process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true',
});
