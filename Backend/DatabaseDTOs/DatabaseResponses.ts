export interface DatabaseDefApiResponse {
  status: number | undefined;
  message: string | undefined;
  definition: any;
  link: string | undefined;
  dataLink: string | undefined;
}

export interface DatabaseMinApiResponse {
  status: number | undefined;
  message: string | undefined;
}

export interface DatabaseApiResponse {
  status: number | undefined;
  message: string | undefined;
  data: any;
  link: string | undefined;
}

export interface DatabaseResourceApiResponse {
  status: number | undefined;
  message: string | undefined;
  data: any;
  link: string | undefined;
  id: string | undefined;
}

export interface DatabaseApiPageResponse {
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
