import { recordFormSchema, toFormValues, toRecordInput } from './schema';

const values = () => ({
  ...toFormValues(),
  partySize: '3',
  temperature: '19.5',
  transport: ' 기차 ',
  highlights: '태양의 신전',
  gateway: '꿈',
  cost: '45,000',
  rating: 5,
});

describe('toRecordInput', () => {
  it('실존 기록은 상상 여행 항목을 비웁니다', () => {
    expect(toRecordInput('p1', 'real', values())).toMatchObject({
      placeId: 'p1',
      partySize: 3,
      temperature: 19.5,
      transport: '기차',
      cost: 45000,
      rating: 5,
      gateway: '',
    });
  });
  it('환상 기록은 현실 여행 항목을 비웁니다', () => {
    expect(toRecordInput('p1', 'fantasy', values())).toMatchObject({
      transport: '',
      temperature: null,
      cost: null,
      highlights: '',
      gateway: '꿈',
      rating: 5,
    });
  });
});

describe('recordFormSchema', () => {
  it('범위를 벗어난 숫자를 거부합니다', () => {
    expect(recordFormSchema.safeParse({ ...values(), partySize: '0' }).success).toBe(false);
    expect(recordFormSchema.safeParse({ ...values(), temperature: '100' }).success).toBe(false);
    expect(recordFormSchema.safeParse({ ...values(), cost: '-1' }).success).toBe(false);
  });
  it('선택 항목은 비워 둘 수 있습니다', () => {
    expect(recordFormSchema.safeParse(toFormValues()).success).toBe(true);
  });
});
