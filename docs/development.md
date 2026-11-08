# 개발 가이드

## 요구 사항

- Node.js 24(`.nvmrc`), pnpm
- iOS: Xcode, CocoaPods
- Android: Android Studio, JDK(`JAVA_HOME`에 Android Studio의 `jbr` 경로 지정)

## 실행

```bash
pnpm install
pnpm run ios       # 또는 pnpm run android
```

`.env`가 없으면 가상 데이터로 동작하는 **데모 모드**로 실행됩니다. 아무 이메일과 비밀번호로 로그인할 수 있고, 앱을 끄면 초기화됩니다.

## 환경 변수

`.env.example`을 `.env`로 복사해 채웁니다.

| 변수                                                        | 용도                                                 |
| ----------------------------------------------------------- | ---------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | 서버 연결. 없으면 데모 모드입니다.                   |
| `GOOGLE_MAPS_ANDROID_API_KEY`                               | Android 지도. iOS는 Apple 지도를 써서 필요 없습니다. |

장소 검색은 Edge Function에서 OpenStreetMap Nominatim을 호출하므로 별도 키가 필요 없습니다. 공용 서버는 초당 1건으로 제한되므로 공개 배포 전에 유료 지오코더나 자체 서버로 바꿉니다.

## 서버 준비 (Supabase)

> **주의:** `20261108000000_ruins_travel.sql`은 이전 낚시·맛집 기록의 전용 칸을 삭제하며 되돌릴 수 없습니다. 기존 데이터가 있는 서버는 `npx supabase db dump --data-only`로 백업한 뒤 `db push`를 실행합니다.

```bash
npx supabase login
npx supabase link --project-ref <프로젝트 ID>
npx supabase db push
npx supabase config push   # 인증 메일 링크가 앱으로 돌아오도록 site_url과 redirect URL을 올립니다.
npx supabase functions deploy place-search
npx supabase functions deploy delete-account
```

| 구성   | 내용                                                                               |
| ------ | ---------------------------------------------------------------------------------- |
| 테이블 | `places`, `records`, `record_photos`, `checklist_items`, 요약 뷰 `place_summaries` |
| 저장소 | 비공개 버킷 `record-photos`, 경로 `{user_id}/{record_id}/{파일}`                   |
| 권한   | 모든 테이블과 저장소에 RLS를 적용해 본인 데이터만 접근합니다.                      |
| 함수   | `place-search`(주소·장소 검색, 좌표→주소), `delete-account`(계정과 사진 삭제)      |

## 오프라인 동작

`shared/api/offline-backend.ts`가 서버 백엔드를 감쌉니다.

- 쓰기는 큐에 넣고 순서대로 보냅니다. 오프라인에 만든 장소에 붙인 기록도 순서가 지켜집니다.
- 저장 ID는 앱이 만들고 서버는 같은 ID를 덮어쓰므로, 응답을 받기 전에 끊겨 다시 보내도 중복되지 않습니다.
- 첨부 사진은 업로드 전까지 문서 폴더에 복사해 둡니다.
- 연결 오류는 대기로 남기고, 서버가 거절한 저장은 입력 화면에 오류를 보여 줍니다. 백그라운드 전송 중 거절되면 동기화 화면에서 다시 시도하거나 버릴 수 있습니다.
- 같은 항목을 여러 기기에서 고치면 나중에 도착한 쪽이 남습니다.
- 대기 변경과 마지막 서버 값은 계정별 키로 보관합니다. 로그아웃하면 서버 값 사본만 지웁니다.
- 데모 모드는 MY 페이지의 `데모 모드 연결 끊기`로 끊긴 상태를 재현합니다.

## 외부 데이터

| 항목       | 출처                                  | 비고                                                                                                                          |
| ---------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 날씨, 기온 | [Open-Meteo](https://open-meteo.com/) | API 키가 없습니다. 버튼을 누를 때만 장소 좌표를 보냅니다. 무료 API는 비상업 용도 조건이므로 상용 배포 전 요금제를 확인합니다. |

## 테스트

| 명령                                            | 내용                                                                               |
| ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm test`                                     | 단위·컴포넌트 테스트 (Jest, React Native Testing Library)                          |
| `pnpm run test:db`                              | 마이그레이션을 PGlite에 적용해 RLS와 제약 조건 검사                                |
| `pnpm run test:e2e`                             | Maestro E2E. 데모 모드 앱을 시뮬레이터에 설치한 뒤 실행합니다.                     |
| `pnpm run test:e2e:server`                      | 로컬 Supabase에 연결한 Release 앱으로 가입부터 계정 삭제까지 검사합니다. 아래 참고 |
| `EXPO_PUBLIC_STORYBOOK_ENABLED=true pnpm start` | 앱에서 `/storybook` 경로로 컴포넌트 카탈로그 확인                                  |

### 실제 서버 경로 검사

Docker와 Supabase CLI로 로컬 서버를 띄우고 그 주소로 앱을 빌드합니다. 메일은 로컬 Mailpit에서 읽습니다.

```bash
supabase start
supabase migration up --local   # 이미 만든 로컬 DB에 새 마이그레이션을 적용합니다.
# EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 과 anon 키로 iOS Release 빌드 후 시뮬레이터에 설치
DEVICE=<시뮬레이터 ID> pnpm run test:e2e:server
```

가입, 메일 인증, 로그인, 장소·사진·기록·체크리스트 저장, 서버 중단 중 재시작과 저장, 복구 후 업로드, 비밀번호 재설정, 계정 삭제를 앱에서 실행하고 DB와 저장소 내용을 직접 조회해 확인합니다. 토큰 만료까지 시험하려면 `auth.jwt_expiry`를 잠시 낮추고 `TOKEN_WAIT`(초)를 지정합니다.

## 배포

`eas.json`에 `development`, `preview`, `production` 프로필이 있습니다.

```bash
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform all
```

Supabase와 Google 지도 값은 EAS 환경 변수에 등록합니다.

## 구조 규칙

Feature-Sliced Design을 따릅니다. `src/app`은 Expo Router 경로이며 `src/_pages`를 다시 내보내기만 합니다.

## 디자인 기준

실존은 사암색, 환상은 보라색으로 구분합니다. 하단 탭(실존·환상·지도·기록·MY), 사진 중심 카드, 지도 위 둥근 바텀시트, 하단 전폭 버튼, 얇은 선 아이콘을 사용합니다.

| 토큰        | 값        | 용도                                                    |
| ----------- | --------- | ------------------------------------------------------- |
| `brand`     | `#c2792b` | 실존 유적 면, 아이콘. 작은 글자에는 쓰지 않습니다.      |
| `brandText` | `#85491a` | 강조 글자, 링크                                         |
| `ink`       | `#1a254f` | 제목, 주요 버튼                                         |
| `fantasy`   | `#7a5af8` | 환상 세계 면. 글자는 `fantasyText`(`#5b3fd1`)를 씁니다. |

## 빌드 주의 사항

- 가입 화면의 비밀번호 칸은 iOS에서 `textContentType="oneTimeCode"`입니다. `newPassword`나 `password`로 두면 비밀번호 칸이 둘인 화면에서 강력한 암호 시트가 입력 중에 다시 떠 글자 입력이 끊겼습니다(iOS 27 시뮬레이터 기준).

- E2E는 Release 빌드로 실행합니다. R8 코드 축소나 키체인 권한 같은 문제는 Debug 빌드에서 드러나지 않습니다.
- Android는 `GOOGLE_MAPS_ANDROID_API_KEY` 없이 빌드하면 지도 자리에 안내 문구가 나옵니다. 키를 추가한 뒤에는 다시 빌드합니다.

## 여행지 도감 자료

여행지는 `src/entities/destination/model/`에 앱과 함께 묶여 있어 오프라인에서도 보입니다.

- 소개글은 나무위키와 위키백과에서 사실을 확인해 새로 쓴 요약입니다. 나무위키 본문은 CC BY-NC-SA 2.0 KR이므로 그대로 옮기지 않습니다. 각 여행지 화면 아래에 출처 링크가 있습니다.
- 사진은 위키미디어 공용의 Public domain, CC0, CC BY, CC BY-SA 파일만 800px로 줄여 `assets/destinations/`에 넣고, 저작자·라이선스·원본 링크를 `images.ts`에 함께 둡니다.
- 환상 세계의 좌표는 실제 위치가 아니라 전승과 이어진 현실의 장소이며, 화면의 `locationNote`로 알립니다.
- 입장 조건과 여행경보는 자주 바뀌므로 단정하지 않고 공식 안내를 확인하도록 안내합니다.
