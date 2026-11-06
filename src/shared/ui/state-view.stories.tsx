import { LoadingView, MessageView } from './state-view';

export default { title: 'shared/StateView', component: MessageView };

export const Message = { args: { message: '저장한 장소가 없습니다.' } };
export const WithAction = {
  args: { message: '불러오지 못했습니다.', actionLabel: '다시 시도', onAction: () => undefined },
};
export const Loading = { render: () => <LoadingView /> };
