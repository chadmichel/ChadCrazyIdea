export interface DynamicField {
  type?: string;
  databind: string;
}

export interface DynamicDropDownItem {
  id: string;
  value: string;
}

export interface DynamicSingleDropDown {
  type?: string;
  databind: string;
  values: DynamicDropDownItem[];
}
