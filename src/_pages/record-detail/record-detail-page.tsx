import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView } from 'react-native';
import { toast } from 'sonner-native';
import { View, XStack, YStack } from 'tamagui';
import { KindBadge } from '@/entities/place';
import { useDeleteRecord, useRecord } from '@/entities/record';
import type { TripRecord } from '@/shared/api';
import { formatDateTime, formatPrice, toErrorMessage } from '@/shared/lib';
import {
  AppText,
  Button,
  Divider,
  Header,
  HeaderTextButton,
  LoadingView,
  MessageView,
  Touchable,
} from '@/shared/ui';
import { PhotoGallery } from '@/widgets/photo-gallery';

type Item = [label: string, value: string];

const stars = (rating: number) => `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}점)`;

const buildSections = (record: TripRecord): [string, Item[]][] => {
  const common: [string, Item[]][] = [
    [
      '함께한 사람',
      [
        ['인원', record.partySize ? `${record.partySize}명` : ''],
        ['동행', record.members.join(', ')],
      ],
    ],
    ['감동', [['별점', record.rating ? stars(record.rating) : '']]],
  ];
  if (record.placeKind === 'real') {
    return [
      ...common,
      ['인상 깊은 곳', [['내용', record.highlights]]],
      [
        '여행 정보',
        [
          ['날씨', record.weather],
          ['기온', record.temperature !== null ? `${record.temperature}℃` : ''],
          ['교통', record.transport],
          ['숙소', record.lodging],
          ['비용', record.cost !== null ? formatPrice(record.cost) : ''],
        ],
      ],
    ];
  }
  return [
    ...common,
    [
      '상상 여행',
      [
        ['들어간 길', record.gateway],
        ['만난 존재', record.encounters],
        ['가져온 것', record.souvenir],
      ],
    ],
  ];
};

const Section = ({ title, items }: { title: string; items: Item[] }) => {
  const filled = items.filter(([, value]) => value);
  if (filled.length === 0) return null;
  return (
    <YStack gap={10}>
      <AppText size="row" tone="ink" bold accessibilityRole="header">
        {title}
      </AppText>
      {filled.map(([label, value]) => (
        <XStack key={label} gap={12} accessible accessibilityLabel={`${label}, ${value}`}>
          <AppText width={72} tone="muted">
            {label}
          </AppText>
          <AppText flex={1}>{value}</AppText>
        </XStack>
      ))}
    </YStack>
  );
};

export const RecordDetailPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const record = useRecord(id);
  const remove = useDeleteRecord();

  if (!record.data) {
    return (
      <View flex={1} backgroundColor="surface">
        <Header title="기록" />
        {record.isError ? (
          <MessageView
            message={toErrorMessage(record.error)}
            actionLabel="다시 시도"
            onAction={() => record.refetch()}
          />
        ) : (
          <LoadingView />
        )}
      </View>
    );
  }

  const data = record.data;
  const confirmDelete = () => {
    Alert.alert('기록 삭제', '이 기록과 첨부 사진이 삭제됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          remove.mutate(id, {
            onSuccess: () => {
              toast.success('기록을 삭제했습니다.');
              router.back();
            },
            onError: (error) => toast.error(toErrorMessage(error, '삭제하지 못했습니다.')),
          }),
      },
    ]);
  };

  return (
    <View flex={1} backgroundColor="surface">
      <Header
        title="기록"
        right={<HeaderTextButton label="편집" onPress={() => router.push(`/record/${id}/edit`)} />}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {data.photos.length > 0 ? (
          <PhotoGallery photos={data.photos} label={data.title || data.placeName} />
        ) : null}
        <YStack padding={20} gap={8}>
          <KindBadge kind={data.placeKind} />
          <AppText size="headline" accessibilityRole="header" testID="record-title">
            {data.title || data.placeName}
          </AppText>
          <AppText tone="muted">{formatDateTime(data.visitedAt)}</AppText>
          <Touchable
            testID="record-place-link"
            onPress={() => router.push(`/place/${data.placeId}`)}
            accessibilityRole="link"
            accessibilityLabel={`장소 보기, ${data.placeName}`}
            justifyContent="center"
            alignSelf="flex-start"
          >
            <AppText tone="brand">{data.placeName}</AppText>
          </Touchable>
        </YStack>
        <Divider />
        <YStack padding={20} gap={28}>
          {buildSections(data).map(([title, items]) => (
            <Section key={title} title={title} items={items} />
          ))}
          {data.memo ? (
            <YStack gap={10}>
              <AppText size="row" tone="ink" bold accessibilityRole="header">
                메모
              </AppText>
              <AppText>{data.memo}</AppText>
            </YStack>
          ) : null}
          <Button
            testID="record-delete"
            variant="danger"
            label="기록 삭제"
            loading={remove.isPending}
            onPress={confirmDelete}
          />
        </YStack>
      </ScrollView>
    </View>
  );
};
