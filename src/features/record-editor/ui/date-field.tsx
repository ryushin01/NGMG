import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { formatDateTime } from '@/shared/lib';
import { AppText, Touchable } from '@/shared/ui';

type DateFieldProps = { value: string; onChange: (iso: string) => void };

export const DateField = ({ value, onChange }: DateFieldProps) => {
  const date = new Date(value);

  const openAndroid = () => {
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      onValueChange: (_event, picked) => {
        DateTimePickerAndroid.open({
          value: picked,
          mode: 'time',
          onValueChange: (_timeEvent, time) => onChange(time.toISOString()),
        });
      },
    });
  };

  return (
    <YStack gap={8}>
      <AppText size="caption" tone="muted" bold>
        날짜와 시간
      </AppText>
      {Platform.OS === 'ios' ? (
        <XStack>
          <DateTimePicker
            testID="record-date"
            value={date}
            mode="datetime"
            display="compact"
            locale="ko-KR"
            accessibilityLabel="날짜와 시간"
            onValueChange={(_event, picked) => onChange(picked.toISOString())}
          />
        </XStack>
      ) : (
        <Touchable
          testID="record-date"
          onPress={openAndroid}
          accessibilityLabel={`날짜와 시간, ${formatDateTime(value)}, 변경`}
          justifyContent="center"
          borderWidth={1}
          borderColor="line"
          borderRadius={6}
          height={50}
          paddingHorizontal={14}
        >
          <AppText>{formatDateTime(value)}</AppText>
        </Touchable>
      )}
    </YStack>
  );
};
