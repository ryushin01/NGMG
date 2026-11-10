#!/bin/zsh
# E2E는 앱 데이터를 지우므로 평소 쓰는 시뮬레이터와 나눠 'NewWorld E2E' 시뮬레이터에서만 돌립니다.
# 사용: pnpm run test:e2e            (e2e 폴더의 모든 흐름)
#       pnpm run test:e2e e2e/checkin-flow.yaml
#       SKIP_BUILD=1 pnpm run test:e2e   (이미 설치한 앱으로 바로 실행)
# 서버 E2E는 e2e-ios.sh가 출력한 기기 ID를 DEVICE로 넘깁니다.
set -eu
cd "$(dirname "$0")/.."

DEVICE_NAME="NewWorld E2E"
DEVICE_TYPE="com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro"
BUNDLE_ID="com.ryushin01.newworld"

# iOS 27 시뮬레이터는 지역 감시(도착 알림)를 지원하지 않아 iOS 26 중 가장 최신을 고릅니다. 없으면 멈춥니다.
# 다른 버전을 쓰려면 E2E_RUNTIME=com.apple.CoreSimulator.SimRuntime.iOS-27-0 처럼 넘깁니다.
runtime=${E2E_RUNTIME:-$(xcrun simctl list runtimes -j | node -e "
  const list = JSON.parse(require('fs').readFileSync(0, 'utf8')).runtimes
    .filter((r) => r.platform === 'iOS' && r.isAvailable)
    .filter((r) => (r.supportedDeviceTypes ?? []).some((d) => d.identifier === '$DEVICE_TYPE'));
  const ios26 = list.filter((r) => r.version.startsWith('26.'));
  process.stdout.write(ios26.at(-1)?.identifier ?? '');
")}
if [ -z "$runtime" ]; then
  echo "iOS 26 시뮬레이터 런타임이 없습니다. Xcode > Settings > Components에서 iOS 26을 설치하거나," >&2
  echo "E2E_RUNTIME으로 다른 런타임을 지정하세요(iOS 27은 도착 알림 흐름이 실패합니다)." >&2
  exit 1
fi

# 그 iOS 버전의 같은 이름 기기가 있으면 쓰고, 없으면 만듭니다(다른 버전의 같은 이름 기기는 쓰지 않음).
udid=$(xcrun simctl list devices available -j | node -e "
  const devices = JSON.parse(require('fs').readFileSync(0, 'utf8')).devices['$runtime'] ?? [];
  const found = devices.find((d) => d.name === '$DEVICE_NAME');
  process.stdout.write(found ? found.udid : '');
")
if [ -z "$udid" ]; then
  udid=$(xcrun simctl create "$DEVICE_NAME" "$DEVICE_TYPE" "$runtime")
  echo "E2E 시뮬레이터를 만들었습니다: $udid"
fi
xcrun simctl boot "$udid" 2>/dev/null || true
xcrun simctl bootstatus "$udid" -b > /dev/null
echo "E2E 시뮬레이터: $DEVICE_NAME ($udid)"

if [ -z "${SKIP_BUILD:-}" ]; then
  npx expo run:ios --configuration Release --device "$udid" --no-bundler
fi

# Maestro는 Java가 필요합니다. 시스템 Java가 없으면 Homebrew openjdk나 Android Studio의 JBR을 씁니다.
if [ -z "${JAVA_HOME:-}" ] && ! /usr/libexec/java_home > /dev/null 2>&1; then
  for home in /opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home \
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home"; do
    if [ -x "$home/bin/java" ]; then
      export JAVA_HOME="$home"
      break
    fi
  done
fi

# 위치 권한(현장 인증, 도착 알림)을 미리 줍니다.
xcrun simctl privacy "$udid" grant location-always "$BUNDLE_ID" || true

maestro --device "$udid" test "${@:-e2e}"
