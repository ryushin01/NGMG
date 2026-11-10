import { ImageManipulator } from 'expo-image-manipulator';
import { compressPhoto } from './photo';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid' }));
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => ({ arrayBuffer: async () => new ArrayBuffer(4) })),
  Directory: jest.fn(),
  Paths: { document: 'file:///doc' },
}));

const mockSaveAsync = jest.fn();
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: jest.fn(() => ({ renderAsync: async () => ({ saveAsync: mockSaveAsync }) })),
  },
}));

const photo = { uri: 'file:///p.jpg', width: 4288, height: 2848 };

beforeEach(() => {
  jest.clearAllMocks();
  mockSaveAsync.mockResolvedValue({ uri: 'file:///out.jpg', width: 1920, height: 1275 });
});

it('긴 변을 넘지 않게 불러온 뒤 JPEG로 저장합니다', async () => {
  const result = await compressPhoto(photo);
  expect(ImageManipulator.manipulate).toHaveBeenCalledWith(photo.uri, {
    maxWidth: 1920,
    maxHeight: 1920,
  });
  expect(mockSaveAsync).toHaveBeenCalledWith({ format: 'jpeg', compress: 0.8 });
  expect(result).toMatchObject({ uri: 'file:///out.jpg', width: 1920, height: 1275 });
});

it('배열 map에 그대로 넘겨 순서 번호가 크기로 들어오면 막습니다', async () => {
  await expect(compressPhoto(photo, 0)).rejects.toThrow(RangeError);
  expect(ImageManipulator.manipulate).not.toHaveBeenCalled();
});

it('저장에 실패하면 형식 오류로 바꿉니다', async () => {
  mockSaveAsync.mockRejectedValue(new Error('Cannot create image data'));
  await expect(compressPhoto(photo)).rejects.toThrow('Unsupported photo format');
});
