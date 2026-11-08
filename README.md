# NewWorld - 신세계

[![CI](https://github.com/ryushin01/NewWorld/actions/workflows/ci.yml/badge.svg)](https://github.com/ryushin01/NewWorld/actions/workflows/ci.yml)
![version](https://img.shields.io/badge/version-2.0.0-c2792b)

피라미드와 잉카 유적부터 아발론과 아르카디아까지, 현실과 상상의 여행지를 탐험하고 기록하는 모바일 앱입니다.

> **프로젝트 상태:** 직접 사용하기 위해 개발 중이며 스토어에는 출시하지 않았습니다. 서버 설정 값이 없으면 가상 데이터로 동작하는 데모 모드로 실행됩니다.

## 화면

저장한 장소와 기록은 모두 가상 데이터입니다.

| 실존 유적                                                                                      | 환상 세계                                                                                      |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| <img src="docs/images/real.jpg" alt="실존 유적 탭의 대륙 필터와 여행지 사진 카드" width="280"> | <img src="docs/images/fantasy.jpg" alt="환상 세계 탭의 전승권 필터와 아발론 카드" width="280"> |

| 여행지 상세                                                                                               | 현실의 연고지                                                                                              |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| <img src="docs/images/destination.jpg" alt="대표 사진, 이름, 소개가 있는 마추픽추 상세 화면" width="280"> | <img src="docs/images/lore.jpg" alt="환상 세계의 위치가 전승상 연고지임을 알리는 안내와 지도" width="280"> |

| 세계 지도                                                                                          | 상상 여행기                                                                                                  |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| <img src="docs/images/map.jpg" alt="세계 지도 위의 실존 핀과 환상 핀, 하단 검색 시트" width="280"> | <img src="docs/images/record-form.jpg" alt="들어간 길과 만난 존재를 적는 상상 여행기 작성 화면" width="280"> |

| 여행 체크리스트                                                                                  | 통계                                                                                                    |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| <img src="docs/images/checklist.jpg" alt="분류별 준비물을 체크하는 여행 체크리스트" width="280"> | <img src="docs/images/stats.jpg" alt="도감 달성률과 월별 기록 막대그래프가 있는 통계 화면" width="280"> |

## 주요 기능

| 기능         | 내용                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------- |
| 실존·환상 탭 | 실존 유적 25곳과 환상 세계 20곳, 대륙·전승권 필터, 이름·지역 검색                            |
| 여행지 상세  | 소개, 볼거리, 가기 좋은 때, 여행 팁, 전승의 원전과 작품, 자료·사진 출처, 오프라인 열람       |
| 지도         | 실존·환상 핀 구분, 핀 묶음, 위성 지도, 현재 위치, 직접 위치 지정, 세계 장소 검색             |
| 여행 기록    | 실존: 날씨, 기온, 교통, 숙소, 비용 / 환상: 들어간 길, 만난 존재, 가져온 것 / 사진 10장, 별점 |
| 가고 싶어요  | 여행지 저장, 다녀옴 표시, 도감 달성률                                                        |
| 체크리스트   | 유적 여행·환상 여행 기본 목록, 여행별 목록 복사, 오프라인 체크                               |
| 통계         | 도감 달성률, 연도별 여행 횟수, 자주 간 곳, 동행, 평균 별점과 비용                            |
| 계정·동기화  | 이메일 가입과 로그인, 서버 동기화, 오프라인 저장, CSV·JSON 내보내기, 계정 삭제               |

## 기술 스택

![React, TypeScript, Supabase, PostgreSQL, Jest, pnpm, GitHub Actions](https://skillicons.dev/icons?i=react,ts,supabase,postgres,jest,pnpm,githubactions)

| 구분        | 사용 기술                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| 프레임워크  | Expo SDK 58, React Native 0.88, React 19, TypeScript, Expo Router                                             |
| UI          | Tamagui 3, Reanimated 4, Gesture Handler, Bottom Sheet, FlashList, Keyboard Controller, sonner-native, Lucide |
| 지도·위치   | react-native-maps, supercluster, expo-location                                                                |
| 상태·데이터 | TanStack Query, zustand, MMKV, React Hook Form, Zod, dayjs                                                    |
| 서버        | Supabase(Postgres, RLS, Auth, Storage, Edge Functions), OpenStreetMap Nominatim, Open-Meteo                   |
| 품질        | ESLint, Prettier, husky, lint-staged, Jest, React Native Testing Library, PGlite, Maestro, Storybook          |
| 배포        | EAS Build, GitHub Actions                                                                                     |

## 시작하기

Node.js 24(`.nvmrc`)와 pnpm, Xcode 또는 Android Studio가 필요합니다.

```bash
pnpm install
pnpm run ios       # 또는 pnpm run android
```

데모 모드에서는 아무 이메일과 비밀번호로 로그인할 수 있습니다.

| 명령                          | 설명                              |
| ----------------------------- | --------------------------------- |
| `pnpm start`                  | 개발 서버                         |
| `pnpm run lint` / `typecheck` | ESLint / 타입 검사                |
| `pnpm test`                   | 단위·컴포넌트 테스트              |
| `pnpm run test:db`            | DB 권한(RLS)과 제약 조건 테스트   |
| `pnpm run test:e2e`           | Release 빌드의 E2E 테스트         |
| `pnpm run test:e2e:server`    | 로컬 Supabase에 연결한 E2E 테스트 |
| `pnpm run assets`             | 앱 아이콘과 지도 핀 생성          |

서버 연결과 배포 방법은 [개발 가이드](docs/development.md)를 참고하세요.

## 프로젝트 구조

```
assets/        앱 아이콘, 지도 핀, 여행지 사진
docs/          문서, 스크린샷
e2e/           Maestro E2E 시나리오
scripts/       에셋 생성
supabase/      마이그레이션, Edge Functions, RLS 테스트
src/
├─ app/        Expo Router 경로 (_pages 재수출)
├─ _app/       Provider, 루트·탭 레이아웃
├─ _pages/     화면
├─ widgets/    지도, 홈 시트, 사진 갤러리, 동기화 배너
├─ features/   인증, 여행지 저장, 장소 검색, 장소·기록 작성, 내보내기
├─ entities/   세션, 여행지 도감, 장소, 기록, 체크리스트
└─ shared/     API, UI, 공통 유틸
```

## 문서

| 문서                               | 내용                                                       |
| ---------------------------------- | ---------------------------------------------------------- |
| [개발 가이드](docs/development.md) | 환경 변수, 서버 준비, 테스트, 배포, 디자인 토큰, 도감 자료 |
| [CHANGELOG](CHANGELOG.md)          | 버전 기록                                                  |
