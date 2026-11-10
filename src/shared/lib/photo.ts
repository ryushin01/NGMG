import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { LocalPhoto } from '../api/types';

const MAX_EDGE = 1920;

/** 긴 변을 줄이고 JPEG로 압축합니다. 위치 정보(EXIF)도 이 과정에서 제거됩니다. */
export const compressPhoto = async (photo: LocalPhoto, maxEdge = MAX_EDGE) => {
  const context = ImageManipulator.manipulate(photo.uri);
  if (Math.max(photo.width, photo.height) > maxEdge) {
    context.resize(photo.width >= photo.height ? { width: maxEdge } : { height: maxEdge });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  const bytes = await new File(saved.uri).arrayBuffer();
  return { bytes, uri: saved.uri, width: saved.width, height: saved.height };
};

const outboxDir = () => new Directory(Paths.document, 'outbox-photos');

/**
 * 업로드 대기 중인 사진 보관소입니다.
 * 임시 폴더의 원본은 OS가 지울 수 있어 문서 폴더로 복사합니다.
 * iOS는 앱 업데이트 때 컨테이너 경로가 바뀌므로 경로가 아닌 파일 이름을 저장합니다.
 */
export const photoStore = {
  async save(uri: string) {
    const directory = outboxDir();
    directory.create({ intermediates: true, idempotent: true });
    const name = `${Crypto.randomUUID()}.jpg`;
    await new File(uri).copy(new File(directory, name));
    return name;
  },
  uriOf: (name: string) => new File(outboxDir(), name).uri,
  remove(name: string) {
    const file = new File(outboxDir(), name);
    if (file.exists) file.delete();
  },
};
