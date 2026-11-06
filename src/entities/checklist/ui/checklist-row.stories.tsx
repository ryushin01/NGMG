import { ChecklistRow } from './checklist-row';

const item = { id: '1', title: '구명조끼', category: '안전', checked: false, position: 0 };
const noop = () => undefined;

export default { title: 'entities/ChecklistRow', component: ChecklistRow };

export const Unchecked = { args: { item, onToggle: noop, onRemove: noop } };
export const Checked = {
  args: { item: { ...item, checked: true }, onToggle: noop, onRemove: noop },
};
