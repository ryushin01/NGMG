import { forwardRef, type ComponentProps } from 'react';
import type { TextInput } from 'react-native';
import { Input, TextArea, YStack } from 'tamagui';
import { AppText } from './typography';

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  multiline?: boolean;
} & Omit<ComponentProps<typeof Input>, 'multiline'>;

/** 레이블과 오류 안내를 함께 제공하는 입력 필드 */
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, hint, required, multiline, ...input },
  ref,
) {
  const Control = multiline ? TextArea : Input;
  const accessibilityLabel = `${label}${required ? ', 필수' : ''}`;
  return (
    <YStack gap={8}>
      <AppText size="caption" tone="muted" bold>
        {label}
        {required ? ' (필수)' : ''}
      </AppText>
      <Control
        ref={ref as never}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={error ?? hint}
        minHeight={multiline ? 112 : 50}
        paddingHorizontal={14}
        paddingVertical={multiline ? 12 : 0}
        textAlignVertical={multiline ? 'top' : 'center'}
        borderWidth={1}
        borderRadius={6}
        borderColor={error ? 'danger' : 'line focus:ink'}
        backgroundColor="surface"
        color="text"
        fontSize={16}
        placeholderTextColor="muted"
        {...input}
      />
      {error ? (
        <AppText
          size="caption"
          tone="danger"
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {error}
        </AppText>
      ) : hint ? (
        <AppText size="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </YStack>
  );
});
