import { DynamicTab } from './DynamicTab';
import { FormAction } from './FormAction';

export interface DynamicForm {
  name: string;
  type?: string;
  actions?: FormAction[];
  tabs?: DynamicTab;
}
