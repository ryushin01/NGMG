export type PlaceKind = 'fishing' | 'restaurant';

export type Place = {
  id: string;
  name: string;
  kind: PlaceKind;
  address: string;
  latitude: number;
  longitude: number;
  memo: string;
  tags: string[];
  recordCount: number;
  lastVisitedAt: string | null;
  createdAt: string;
};

export type PlaceInput = Pick<
  Place,
  'name' | 'kind' | 'address' | 'latitude' | 'longitude' | 'memo' | 'tags'
>;

export type Photo = {
  id: string;
  path: string;
  url: string;
  width: number;
  height: number;
};

/** 아직 업로드하지 않은 기기 안의 사진 */
export type LocalPhoto = { uri: string; width: number; height: number };

export type TripRecord = {
  id: string;
  placeId: string;
  placeName: string;
  placeKind: PlaceKind;
  visitedAt: string;
  title: string;
  memo: string;
  partySize: number | null;
  members: string[];
  gear: string;
  rig: string;
  bait: string;
  weather: string;
  tide: string;
  wind: string;
  waterTemp: number | null;
  catches: string;
  menu: string;
  price: number | null;
  rating: number | null;
  photos: Photo[];
};

export type RecordInput = Omit<TripRecord, 'id' | 'placeName' | 'placeKind' | 'photos'>;

export type RecordSaveInput = {
  record: RecordInput;
  /** 수정할 때 유지할 기존 사진 */
  keptPhotos: Photo[];
  newPhotos: LocalPhoto[];
};

export type SearchResult = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type ChecklistItem = {
  id: string;
  title: string;
  category: string;
  checked: boolean;
  position: number;
  /** 출조별로 나눈 목록의 이름 */
  listName: string;
};

export type Session = { userId: string; email: string };

export type Backend = {
  mode: 'supabase' | 'demo';
  auth: {
    /** 네트워크를 기다리지 않고 이 기기에 남은 세션을 돌려줍니다. */
    getCachedSession(): Session | null;
    getSession(): Promise<Session | null>;
    /** 유효한 토큰으로 서버를 호출할 수 있는지 확인합니다. 만료 토큰 갱신도 시도합니다. */
    isReady(): Promise<boolean>;
    subscribe(listener: (session: Session | null) => void): () => void;
    signIn(email: string, password: string): Promise<void>;
    /** 이메일 확인이 필요하면 needsConfirmation이 true입니다. */
    signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }>;
    signOut(): Promise<void>;
    sendPasswordReset(email: string): Promise<void>;
    /** 재설정 메일 링크에 담긴 토큰으로 로그인합니다. 재설정 링크가 아니면 false입니다. */
    applyRecoveryLink(url: string): Promise<boolean>;
    updatePassword(password: string): Promise<void>;
    deleteAccount(): Promise<void>;
  };
  places: {
    list(): Promise<Place[]>;
    get(id: string): Promise<Place>;
    /** id를 주면 그 값으로 만듭니다. 같은 id로 다시 보내도 중복되지 않습니다. */
    create(input: PlaceInput, id?: string): Promise<Place>;
    update(id: string, input: PlaceInput): Promise<Place>;
    remove(id: string): Promise<void>;
  };
  records: {
    list(filter?: { placeId?: string }): Promise<TripRecord[]>;
    get(id: string): Promise<TripRecord>;
    create(input: RecordSaveInput, id?: string): Promise<TripRecord>;
    update(id: string, input: RecordSaveInput): Promise<TripRecord>;
    remove(id: string): Promise<void>;
  };
  checklist: {
    list(): Promise<ChecklistItem[]>;
    /** 같은 id가 있으면 덮어씁니다. */
    upsert(items: ChecklistItem[]): Promise<void>;
    remove(ids: string[]): Promise<void>;
  };
  search: {
    places(query: string): Promise<SearchResult[]>;
    reverseGeocode(latitude: number, longitude: number): Promise<string>;
  };
};
