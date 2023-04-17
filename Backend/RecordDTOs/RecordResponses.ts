export interface RecordDefApiResponse {
  status: number | undefined;
  message: string | undefined;
  definition: any;
  link: string | undefined;
  dataLink: string | undefined;
}

export interface RecordMinApiResponse {
  status: number | undefined;
  message: string | undefined;
}

export interface RecordApiResponse {
  status: number | undefined;
  message: string | undefined;
  data: any;
  link: string | undefined;
}

export interface RecordResourceApiResponse {
  status: number | undefined;
  message: string | undefined;
  data: any;
  link: string | undefined;
  id: string | undefined;
}

export interface RecordApiPageResponse {
  status: number | undefined;
  message: string | undefined;
  data: any;
  link: string | undefined;
  nextLink: string | undefined;
  previousLink: string | undefined;
  page: number | undefined;
  pageRows: number | undefined;
  pageSize: number | undefined;
  totalRows: number | undefined;
  totalPages: number | undefined;
}
