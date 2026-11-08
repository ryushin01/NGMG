import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { Platform } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { AppText, Button } from '@/shared/ui';

type TripDateFieldProps = {
  label: string;
  value: string | null;
  error?: string;
  testID: string;
  onChange: (date: string | null) => void;
};

const toDay = (date: Date) => dayjs(date).format('YYYY-MM-DD');

export const TripDateField = ({ label, value, error, testID, onChange }: TripDateFieldProps) => {
  const date = value ? dayjs(value).toDate() : new Date();
  const pickAndroid = () =>
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      onValueChange: (_event, picked) => onChange(toDay(picked)),
    });
  return (
    <YStack gap={8}>
      <AppText size="caption" tone="muted" bold>
        {label}
      </AppText>
      <XStack gap={8} alignItems="center">
        {value && Platform.OS === 'ios' ? (
          <DateTimePicker
            testID={testID}
            value={date}
            mode="date"
            display="compact"
            locale="ko-KR"
            accessibilityLabel={label}
            onValueChange={(_event, picked) => onChange(toDay(picked))}
          />
        ) : (
          <Button
            testID={testID}
            variant="outline"
            label={value ?? '날짜 정하기'}
            onPress={() => (Platform.OS === 'ios' ? onChange(toDay(new Date())) : pickAndroid())}
          />
        )}
        {value ? (
          <Button
            testID={`${testID}-clear`}
            variant="outline"
            label="지우기"
            onPress={() => onChange(null)}
          />
        ) : null}
      </XStack>
      {error ? (
        <AppText size="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </YStack>
  );
};
