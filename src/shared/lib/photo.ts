import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { LocalPhoto } from '../api/types';

const MAX_EDGE = 1920;

/** 긴 변을 줄이고 JPEG로 압축합니다. 위치 정보(EXIF)도 이 과정에서 제거됩니다. */
export const compressPhoto = async (photo: LocalPhoto, maxEdge = MAX_EDGE) => {
  if (!(maxEdge > 0)) throw new RangeError(`maxEdge must be positive: ${maxEdge}`);
  // 불러올 때부터 작게 읽어 원본 크기의 비트맵을 메모리에 올리지 않습니다. 사진이 더 작으면 원래 크기로 읽습니다.
  // (`photos.map(compressPhoto)`처럼 넘기면 배열 순서 번호가 maxEdge로 들어가므로 위에서 막습니다.)
  const context = ImageManipulator.manipulate(photo.uri, { maxWidth: maxEdge, maxHeight: maxEdge });
  const rendered = await context.renderAsync();
  const saved = await rendered
    .saveAsync({ format: SaveFormat.JPEG, compress: 0.8 })
    .catch((error: unknown) => {
      // JPEG로 만들 수 없는 사진은 위치 정보가 남은 원본을 그대로 올리지 않고 다른 사진을 고르게 합니다.
      throw new Error('Unsupported photo format', { cause: error });
    });
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
