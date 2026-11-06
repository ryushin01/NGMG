import { Header, HeaderTextButton } from './header';

export default { title: 'shared/Header', component: Header };

export const Default = { args: { title: '내 장소' } };
export const WithAction = {
  args: { title: '기록', right: <HeaderTextButton label="편집" onPress={() => undefined} /> },
};
