import { RatingField } from './rating-field';

export default { title: 'features/RatingField', component: RatingField };

export const Empty = { args: { value: null, onChange: () => undefined } };
export const Rated = { args: { value: 4, onChange: () => undefined } };
