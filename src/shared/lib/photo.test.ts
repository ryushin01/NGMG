import { ImageManipulator } from 'expo-image-manipulator';
import { compressPhoto } from './photo';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid' }));
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => ({ arrayBuffer: async () => new ArrayBuffer(4) })),
  Directory: jest.fn(),
  Paths: { document: 'file:///doc' },
}));

const mockSaveAsync = jest.fn();
const mockRenderAsync = jest.fn();
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: jest.fn(() => ({ renderAsync: mockRenderAsync })),
  },
}));

const photo = { uri: 'file:///p.jpg', width: 4288, height: 2848 };

beforeEach(() => {
  jest.clearAllMocks();
  mockSaveAsync.mockResolvedValue({ uri: 'file:///out.jpg', width: 1920, height: 1275 });
  mockRenderAsync.mockResolvedValue({ saveAsync: mockSaveAsync });
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

it('JPEG로 만들 수 없으면 형식 오류로 바꿉니다', async () => {
  mockSaveAsync.mockRejectedValue(new Error('Cannot create image data for given image format'));
  await expect(compressPhoto(photo)).rejects.toThrow('Unsupported photo format');
});

it('사진을 읽지 못해도 형식 오류로 바꿉니다', async () => {
  mockRenderAsync.mockRejectedValueOnce(new Error('Could not load the image: file:///p.jpg'));
  await expect(compressPhoto(photo)).rejects.toThrow('Unsupported photo format');
});

it('파일 쓰기 실패는 그대로 던집니다', async () => {
  mockSaveAsync.mockRejectedValue(new Error('Writing image data to the file has failed: x'));
  await expect(compressPhoto(photo)).rejects.toThrow('Writing image data');
});
