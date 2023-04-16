import { DynamicRow } from './DynamicRow';

export interface DynamicPanel {
  name: string;
  expandable?: boolean;
  expanded?: boolean;
  rows?: DynamicRow[];
}
