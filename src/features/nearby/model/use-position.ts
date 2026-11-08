import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

type Position = { latitude: number; longitude: number };

const read = async (): Promise<Position | null> => {
  try {
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: coords.latitude, longitude: coords.longitude };
  } catch {
    return null;
  }
};

/** 사용자가 요청할 때만 권한을 묻고 현재 위치를 가져옵니다. */
export const usePosition = () => {
  const [position, setPosition] = useState<Position | null>(null);
  const request = async () => {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return false;
    const found = await read();
    setPosition(found);
    return !!found;
  };
  return { position, request };
};

/** 이미 허용한 경우에만 위치를 읽습니다. 화면을 여는 것만으로 권한을 묻지 않습니다. */
export const useAutoPosition = () => {
  const [position, setPosition] = useState<Position | null>(null);
  useEffect(() => {
    let active = true;
    Location.getForegroundPermissionsAsync()
      .then(({ granted }) => (granted ? read() : null))
      .then((found) => {
        if (active) setPosition(found);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return position;
};
