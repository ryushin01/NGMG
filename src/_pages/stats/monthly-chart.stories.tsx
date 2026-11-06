import { MonthlyChart } from './monthly-chart';

export default { title: 'pages/MonthlyChart', component: MonthlyChart };

export const Filled = { args: { monthly: [1, 0, 4, 2, 0, 0, 1, 3, 6, 5, 2, 0] } };
export const Empty = { args: { monthly: Array.from({ length: 12 }, () => 0) } };
