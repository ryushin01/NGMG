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

`.env`가 없으면 가상 데이터로 동작하는 **데모 모드**로 실행됩니다. 로그인 화면의 `둘러보기` 버튼이나 아무 이메일과 비밀번호로 들어갈 수 있고, 변경 내용은 기기에 저장됩니다. MY의 계정 삭제를 누르면 예시 데이터로 되돌아갑니다.

## 환경 변수

`.env.example`을 `.env`로 복사해 채웁니다.

| 변수                                                        | 용도                                                 |
| ----------------------------------------------------------- | ---------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | 서버 연결. 없으면 데모 모드입니다.                   |
| `GOOGLE_MAPS_ANDROID_API_KEY`                               | Android 지도. iOS는 Apple 지도를 써서 필요 없습니다. |

장소 검색은 Edge Function에서 OpenStreetMap 기반 [Photon](https://photon.komoot.io/) 공개 서버를 호출하므로 별도 키가 필요 없습니다. 공개 서버는 사용량 보장이 없고 한국어 지명은 잘 찾지 못하므로, 공개 배포 전에 자체 서버나 유료 지오코더로 바꿉니다. 공용 Nominatim은 Supabase Edge의 접속을 403으로 차단합니다.

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

| 구성   | 내용                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------- |
| 테이블 | `places`, `records`, `record_photos`, `checklist_items`, `trips`, `checkins`, 요약 뷰 `place_summaries` |
| 저장소 | 비공개 버킷 `record-photos`, 경로 `{user_id}/{record_id}/{파일}`                                        |
| 권한   | 모든 테이블과 저장소에 RLS를 적용해 본인 데이터만 접근합니다.                                           |
| 함수   | `place-search`(주소·장소 검색, 좌표→주소), `delete-account`(계정과 사진 삭제)                           |

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

## 글꼴

| 역할        | 글꼴                                                | 적용                                |
| ----------- | --------------------------------------------------- | ----------------------------------- |
| 제목        | 고운바탕 굵은 체(`@expo-google-fonts/gowun-batang`) | `AppText`의 `title`·`headline` 크기 |
| 영문 원어명 | Marcellus(`@expo-google-fonts/marcellus`)           | `AppText`의 `latin`                 |
| 본문        | 운영체제 글꼴                                       | 나머지                              |

- 고운돋움처럼 굵기가 하나뿐인 한글 글꼴은 본문의 굵은 글씨가 사라져 본문에는 쓰지 않습니다.
- 제목 글꼴은 파일 자체가 굵어 `fontWeight`를 더하지 않습니다(Android에서 이중으로 굵어지는 것을 막음).
- `useAppFonts`(`src/shared/ui/fonts.ts`)로 불러오고, 끝날 때까지 스플래시를 유지합니다. 실패하면 시스템 글꼴로 계속합니다.
- 웹 빌드(Expo Web)는 시도했으나 Tamagui 3의 가로 배치·고정 위치 스타일이 적용되지 않아 보류했습니다.

## 여행지 도감 자료

여행지는 `src/entities/destination/model/`에 앱과 함께 묶여 있어 오프라인에서도 보입니다.

- 소개글은 나무위키와 위키백과에서 사실을 확인해 새로 쓴 요약입니다. 나무위키 본문은 CC BY-NC-SA 2.0 KR이므로 그대로 옮기지 않습니다. 각 여행지 화면 아래에 출처 링크가 있습니다.
- 사진은 위키미디어 공용의 Public domain, CC0, CC BY, CC BY-SA 파일만 800px로 줄여 `assets/destinations/`에 넣고, 저작자·라이선스·원본 링크를 `images.ts`에 함께 둡니다.
- 환상 세계의 좌표는 실제 위치가 아니라 전승과 이어진 현실의 장소이며, 화면의 `locationNote`로 알립니다.
- 입장 조건과 여행경보는 자주 바뀌므로 단정하지 않고 공식 안내를 확인하도록 안내합니다.
- 분류(`lore`)는 환상 세계가 `myth`(신과 창세·낙원·저승)·`legend`(영웅, 사라진 도시, 민간 전승, 문학), 실존 유적이 `history`(신화·전설이 얽힌 곳, `loreNote`에 근거 한 줄)·`fact`입니다.
- 전설과 실제 장소의 연결은 `links.ts`, 코스는 `courses.ts`, 연대표 정렬은 `timeline.ts`, 원전 링크는 `reading.ts`에 있습니다.

## 현장 인증과 뱃지

- 인증은 `features/check-in`이 위치 권한을 받아 현재 위치와 여행지 좌표의 거리를 재고, 3km(`CHECK_IN_RADIUS_KM`) 안이면 저장합니다. 환상 세계는 화면에 보여 주는 현실의 연고지 좌표를 씁니다.
- 회원마다 여행지 한 곳에 인증 하나만 남깁니다(`checkins`의 `unique(user_id, catalog_id)`). 다시 인증해도 처음 날짜가 유지됩니다.
- 데모 모드(`.env` 없음)에서는 위치 없이 인증하는 버튼이 따로 나오고, `method = 'demo'`로 저장해 화면에 '데모 인증'으로 표시합니다.
- 뱃지는 서버에 저장하지 않고 `features/badges`가 인증 목록으로 계산합니다. 신화 모험 뱃지는 `entities/destination/model/myth.ts`의 낙원·저승·신들의 거처 목록을 기준으로 셉니다(화면 분류에는 쓰지 않음). 조건을 채운 인증의 날짜가 획득일이며, 규칙을 바꾸면 기존 인증에도 바로 반영됩니다.
- 지도에서는 인증한 여행지를 체크가 붙은 핀(`assets/pins/*-verified.png`, `pnpm run assets`로 생성)으로 바꿔 색 없이도 구별합니다.
- 인증 후 축하 화면은 인증 전후 목록을 비교해 새로 받은 뱃지만 보여 줍니다(`widgets/check-in-panel`).
- E2E(`e2e/checkin-flow.yaml`)는 Maestro `setLocation`으로 시뮬레이터 위치를 글래스턴베리에 두고 아발론을 인증합니다.

## 근처 도착 알림

- MY의 `근처 여행지 도착 알림`으로 켭니다. 이유를 먼저 설명한 뒤 위치(사용 중 → 항상)와 알림 권한을 차례로 받습니다.
- `expo-location`의 지역 감시(geofencing)와 `expo-task-manager`의 백그라운드 작업(`features/arrival-alert/model/task.ts`, 루트 레이아웃에서 불러와 정의)을 씁니다. 위치는 기기 밖으로 보내지 않습니다.
- iOS는 앱 하나에 20곳까지 감시하므로 아직 인증하지 않은 가까운 여행지 19곳(반경 3km)과 현재 위치를 둘러싼 갱신 지역(반경 50km) 1곳을 등록합니다. 갱신 지역을 벗어나면 마지막으로 저장한 인증 목록으로 지역을 다시 고릅니다.
- 앱으로 돌아오거나 인증 목록이 바뀌어도 다시 고릅니다(`useArrivalSync`, 탭 레이아웃). 같은 곳은 12시간 안에 다시 알리지 않습니다.
- 알림은 원격 푸시 없이 기기에서 만드는 로컬 알림이며(`enableRemoteNotifications: false`), 누르면 `/destination/{id}`로 갑니다(`useNotificationLink`).
- Expo Go에서는 동작하지 않으므로 개발 빌드나 Release 빌드로 확인합니다.
- E2E(`e2e/arrival-flow.yaml`)는 서울에서 알림을 켜고 글래스턴베리로 옮겨 알림 센터 화면을 남깁니다. 실행 전 `xcrun simctl privacy booted grant location-always com.ryushin01.newworld`로 권한을 줍니다. Maestro는 시스템 화면의 글자를 읽거나 알림을 눌러 앱을 열지 못하므로, 알림을 눌러 이동하는 동작은 단위 테스트로 확인합니다. 지도 마커도 Maestro가 읽지 못해 화면으로 확인합니다.

## 서버 적용 현황

Supabase 프로젝트 `newworld`에는 `20261108000000`까지 적용되어 있습니다. 무료 플랜의 활성 프로젝트 한도 때문에 일시 중지한 상태이며, 앱은 `.env` 없이 데모 모드로 동작합니다. 다시 켜면 `npx supabase db push`로 `20261109000000_trips_currency.sql`(통화, 여정)과 `20261110000000_checkins.sql`(현장 인증)을 적용합니다.
