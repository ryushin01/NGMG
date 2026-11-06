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

const buildSections = (record: TripRecord): [string, Item[]][] => {
  const people: Item[] = [
    ['인원', record.partySize ? `${record.partySize}명` : ''],
    [record.placeKind === 'fishing' ? '출조 멤버' : '동행', record.members.join(', ')],
  ];
  if (record.placeKind === 'fishing') {
    return [
      ['출조 인원', people],
      ['조과', [['조과', record.catches]]],
      [
        '장비와 채비',
        [
          ['출조 장비', record.gear],
          ['채비', record.rig],
          ['미끼', record.bait],
        ],
      ],
      [
        '조건',
        [
          ['날씨', record.weather],
          ['물때', record.tide],
          ['바람', record.wind],
          ['수온', record.waterTemp !== null ? `${record.waterTemp}℃` : ''],
        ],
      ],
    ];
  }
  return [
    ['함께한 사람', people],
    [
      '식사',
      [
        ['메뉴', record.menu],
        ['가격', record.price !== null ? formatPrice(record.price) : ''],
        [
          '별점',
          record.rating
            ? `${'★'.repeat(record.rating)}${'☆'.repeat(5 - record.rating)} (${record.rating}점)`
            : '',
        ],
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
      <View flex={1} backgroundColor="white">
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
    <View flex={1} backgroundColor="white">
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
