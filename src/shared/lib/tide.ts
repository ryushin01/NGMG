const RAD = Math.PI / 180;
const SYNODIC = 29.530588861;
const KST_DAYS = 9 / 24;
const UNIX_EPOCH_JD = 2440587.5;
/** 지구 자전 지연(ΔT) 약 70초를 뺍니다. 하루 경계 판단에는 이 정도로 충분합니다. */
const DELTA_T = 70 / 86400;

/** Meeus, Astronomical Algorithms 49장의 삭(new moon) 계산입니다. 결과는 율리우스일입니다. */
const newMoon = (k: number) => {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = (2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3) * RAD;
  const Mp =
    (201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T2 * T2) * RAD;
  const F =
    (160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T2 * T2) * RAD;
  const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3) * RAD;
  const s = Math.sin;
  const jde =
    2451550.09766 +
    SYNODIC * k +
    0.00015437 * T2 -
    0.00000015 * T3 +
    0.00000000073 * T2 * T2 -
    0.4072 * s(Mp) +
    0.17241 * E * s(M) +
    0.01608 * s(2 * Mp) +
    0.01039 * s(2 * F) +
    0.00739 * E * s(Mp - M) -
    0.00514 * E * s(Mp + M) +
    0.00208 * E * E * s(2 * M) -
    0.00111 * s(Mp - 2 * F) -
    0.00057 * s(Mp + 2 * F) +
    0.00056 * E * s(2 * Mp + M) -
    0.00042 * s(3 * Mp) +
    0.00042 * E * s(M + 2 * F) +
    0.00038 * E * s(M - 2 * F) -
    0.00024 * E * s(2 * Mp - M) -
    0.00017 * s(Om);
  return jde - DELTA_T;
};

/** 율리우스일을 한국 시각 기준 날짜 번호로 바꿉니다. */
const kstDayNumber = (jd: number) => Math.floor(jd + 0.5 + KST_DAYS);

/** 음력 날짜의 일(1~30)을 구합니다. 삭이 든 날이 음력 1일입니다. */
export const getLunarDay = (date: Date) => {
  const jd = date.getTime() / 86400000 + UNIX_EPOCH_JD;
  const today = kstDayNumber(jd);
  let k = Math.floor((jd - 2451550.09766) / SYNODIC) + 1;
  while (kstDayNumber(newMoon(k)) > today) k -= 1;
  return today - kstDayNumber(newMoon(k)) + 1;
};

const SEVEN = ['7물', '8물', '9물', '10물', '11물', '12물', '13물', '조금', '무시'];
const EIGHT = ['8물', '9물', '10물', '11물', '12물', '13물', '14물', '조금'];

/**
 * 해역 구분은 좌표로 어림합니다. 서해는 7물때식, 남해·동해는 8물때식을 씁니다.
 * 경계 근처는 맞지 않을 수 있어 화면에서 고칠 수 있게 둡니다.
 */
const isWestSea = (latitude: number, longitude: number) => latitude >= 34.3 && longitude < 126.7;

export const getTide = (date: Date, latitude: number, longitude: number) => {
  const lunarDay = getLunarDay(date);
  const position = ((lunarDay - 1) % 15) + 1;
  const west = isWestSea(latitude, longitude);
  const named = west ? SEVEN : EIGHT;
  const name = position <= named.length ? named[position - 1] : `${position - named.length}물`;
  return { lunarDay, name, system: west ? '7물때식' : '8물때식' };
};
