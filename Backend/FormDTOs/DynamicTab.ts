import { DynamicPanel } from './DynamicPanel';

export interface DynamicTab {
  name: string;
  type?: string;
  panels?: DynamicPanel[];
}
