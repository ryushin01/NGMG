import { recordFormSchema, toFormValues, toRecordInput } from './schema';

const values = () => ({
  ...toFormValues(),
  partySize: '3',
  waterTemp: '19.5',
  gear: ' 릴찌대 ',
  menu: '회',
  price: '45,000',
  rating: 5,
});

describe('toRecordInput', () => {
  it('낚시 기록은 맛집 항목을 비웁니다', () => {
    const input = toRecordInput('p1', 'fishing', values());
    expect(input).toMatchObject({
      placeId: 'p1',
      partySize: 3,
      waterTemp: 19.5,
      gear: '릴찌대',
      menu: '',
      price: null,
      rating: null,
    });
  });
  it('맛집 기록은 낚시 항목을 비웁니다', () => {
    const input = toRecordInput('p1', 'restaurant', values());
    expect(input).toMatchObject({ gear: '', waterTemp: null, menu: '회', price: 45000, rating: 5 });
  });
});

describe('recordFormSchema', () => {
  it('범위를 벗어난 숫자를 거부합니다', () => {
    expect(recordFormSchema.safeParse({ ...values(), partySize: '0' }).success).toBe(false);
    expect(recordFormSchema.safeParse({ ...values(), waterTemp: '100' }).success).toBe(false);
    expect(recordFormSchema.safeParse({ ...values(), price: '-1' }).success).toBe(false);
  });
  it('선택 항목은 비워 둘 수 있습니다', () => {
    expect(recordFormSchema.safeParse(toFormValues()).success).toBe(true);
  });
});
