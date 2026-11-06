#!/bin/zsh
# 로컬 Supabase에 연결한 Release 앱을 시뮬레이터에 설치한 뒤 실행합니다.
# 필요 조건: supabase start, supabase migration up --local, maestro, DEVICE(시뮬레이터 ID)
# Android는 PLATFORM=android, DEVICE=emulator-5554로 실행하고 먼저 adb reverse tcp:54321 tcp:54321을 설정합니다.
# 토큰 만료까지 시험하려면 supabase/config.toml의 auth.jwt_expiry를 잠시 낮추고 TOKEN_WAIT(초)를 줍니다.
set -u
cd "$(dirname "$0")"
EMAIL="e2e-$(date +%s)@ngmg.test"
DB=supabase_db_ngmg
sql() { docker exec -i "$DB" psql -U postgres -At -c "$1"; }
mail_link() {
  # 수신자 메일 중 $1을 포함한 가장 최근 메일의 첫 인증 링크를 찾습니다.
  curl -s "http://127.0.0.1:54324/api/v1/search?query=to:$EMAIL" |
    node -e "
      let raw='';process.stdin.on('data',d=>raw+=d).on('end',async()=>{
        const list=JSON.parse(raw).messages.filter(m=>m.Subject.includes('$1'));
        if(!list.length){process.exit(1)}
        const res=await fetch('http://127.0.0.1:54324/api/v1/message/'+list[0].ID);
        const body=await res.json();
        const m=body.Text.match(/https?:[^\s)]+verify[^\s)]+/);
        console.log(m[0]);
      })"
}
step() { echo "== $1"; timeout "${STEP_TIMEOUT:-420}" maestro --device "$DEVICE" test -e EMAIL="$EMAIL" "$1.yaml" > "$LOGS/$1.log" 2>&1 || { grep -E "FAILED|Assertion is false" "$LOGS/$1.log" | head -3; exit 1; }; }
check() { [ "$2" = "$3" ] && echo "ok   $1 = $2" || { echo "FAIL $1: $2 (기대값 $3)"; FAILED=1; }; }
FAILED=0
LOGS=$(mktemp -d)
echo "로그와 스크린샷: $LOGS"
screenshot() {
  if [ "${PLATFORM:-ios}" = android ]; then
    adb -s "$DEVICE" exec-out screencap -p > "$LOGS/$1.png"
  else
    xcrun simctl io "$DEVICE" screenshot "$LOGS/$1.png" > /dev/null 2>&1
  fi
}

step 1-sign-up
LINK=$(mail_link Confirm); echo "인증 링크 수신"
curl -s -o /dev/null -L --max-redirs 1 "$LINK" || true
check "인증 완료" "$(sql "select count(*) from auth.users where email='$EMAIL' and email_confirmed_at is not null")" 1

step 2-data
sleep 2
UID_=$(sql "select id from auth.users where email='$EMAIL'")
check "장소" "$(sql "select count(*) from public.places where user_id='$UID_'")" 1
check "기록" "$(sql "select count(*) from public.records where user_id='$UID_'")" 1
check "사진 행" "$(sql "select count(*) from public.record_photos where user_id='$UID_'")" 3
check "저장소 파일" "$(sql "select count(*) from storage.objects where bucket_id='record-photos' and name like '$UID_/%'")" 3
check "체크리스트" "$(sql "select count(*) from public.checklist_items where user_id='$UID_'")" 24
check "체크된 항목" "$(sql "select string_agg(title, ',') from public.checklist_items where user_id='$UID_' and checked")" 낚싯대

# 행 없이 남은 파일은 다음 저장 때 지워집니다.
RID=$(sql "select id from public.records where user_id='$UID_' limit 1")
sql "insert into storage.objects (bucket_id, name, owner_id) values ('record-photos', '$UID_/$RID/orphan.jpg', '$UID_')" > /dev/null
step 2a-edit
sleep 3
check "남은 파일 정리" "$(sql "select count(*) from storage.objects where name='$UID_/$RID/orphan.jpg'")" 0
check "사진 파일 유지" "$(sql "select count(*) from storage.objects where bucket_id='record-photos' and name like '$UID_/%'")" 3

# 토큰이 만료될 시간을 기다렸다가 서버 없이 앱을 다시 켭니다.
docker stop supabase_kong_ngmg > /dev/null
sleep "${TOKEN_WAIT:-0}"
step 2b-offline
screenshot offline-photo
step 2c-pending-after-restart
check "끊긴 동안 서버에 올라가지 않음" "$(sql "select count(*) from public.records where user_id='$UID_'")" 1
# 끊긴 상태에서도 로그아웃되고, 올리지 못한 변경은 다시 로그인하면 올라갑니다.
step 2c2-offline-sign-out
docker start supabase_kong_ngmg > /dev/null
sleep 10
step 2d-recover
check "복구 후 기록" "$(sql "select count(*) from public.records where user_id='$UID_' and title='끊김 출조'")" 1
check "복구 후 체크" "$(sql "select count(*) from public.checklist_items where user_id='$UID_' and checked")" 2

step 3-reload
LINK=$(mail_link Reset); echo "재설정 링크 수신"
TARGET=$(curl -s -o /dev/null -w '%{redirect_url}' "$LINK")
case "$TARGET" in ngmg://*access_token*type=recovery*) echo "ok   재설정 링크가 앱으로 연결";; *) echo "FAIL 재설정 링크: ${TARGET%%#*}"; FAILED=1;; esac
if [ "${PLATFORM:-ios}" = android ]; then
  adb -s "$DEVICE" shell "am start -a android.intent.action.VIEW -d '$TARGET'" > /dev/null
else
  xcrun simctl openurl "$DEVICE" "$TARGET"
fi

step 4-new-password
sleep 2
check "사용자 삭제" "$(sql "select count(*) from auth.users where id='$UID_'")" 0
check "장소 삭제" "$(sql "select count(*) from public.places where user_id='$UID_'")" 0
check "체크리스트 삭제" "$(sql "select count(*) from public.checklist_items where user_id='$UID_'")" 0
check "저장소 파일 삭제" "$(sql "select count(*) from storage.objects where bucket_id='record-photos' and name like '$UID_/%'")" 0
exit $FAILED
