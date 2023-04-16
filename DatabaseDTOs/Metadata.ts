import { DynamicForm } from '../FormDTOs/DynamicForm';
import { WorkflowTemplate } from '../Workflow/WorkflowTemplate';
import { ColumnDef } from './ColumnDef';
import { IndexDef } from './IndexDef';

export interface Metadata {
  name: string;
  type: string;
  columns?: ColumnDef[];
  indexes?: IndexDef[];
  forms?: DynamicForm[];
  notifications?: DynamicForm[];
  workflow?: WorkflowTemplate[];
  extra?: object;
}
