import { render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '~/tamagui.config';
import type { Destination } from '../model/types';
import { Postcard } from './postcard';

it('분류, 이름, 소개, 위치와 날짜를 담습니다', async () => {
  await render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <Postcard
        destination={
          {
            id: 'petra',
            realm: 'real',
            name: '페트라',
            tagline: '장미의 도시',
            location: '요르단',
            image: 1,
          } as Destination
        }
        dateLabel="2026. 11. 10."
      />
    </TamaguiProvider>,
  );
  for (const text of ['실존 유적', '페트라', '장미의 도시', '신세계 · 요르단', '2026. 11. 10.']) {
    expect(screen.getByText(text)).toBeTruthy();
  }
});
