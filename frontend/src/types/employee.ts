export interface Station {
  id: number;
  code: string;
  name: string;
  location: string;
  phone: string;
  email: string;
  is_active: boolean;
}

export interface Division {
  id: number;
  code: string;
  name: string;
  description: string;
  directorate: string;
  is_active: boolean;
}

export interface Employee {
  id: number;
  email: string | null;
  employee_id: string;
  staff_id: string;
  full_name: string;
  title: string;
  station: Station | null;
  division: Division | null;
  gender: string;
  date_of_birth: string | null;
  phone_number: string;
  marital_status: string;
  number_of_dependents: number;
  role: string;
  directorate: string;
  date_registered: string;
  discontinued: boolean;
  discontinued_date: string | null;
  avatar: string | null;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface Pagination {
  total_items: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  next_page_number: number | null;
  previous_page_number: number | null;
}

export interface FiltersAvailable {
  [key: string]: string;
}

export interface EmployeesResponse {
  status: string;
  message: string;
  http_status: number;
  data: {
    items: Employee[];
    pagination: Pagination;
    filters: {
      applied: Record<string, any>;
      available: FiltersAvailable;
    };
  };
  code: string;
  request_id: string;
}

export interface EmployeeQueryParams {
  search?: string;
  role?: string;
  station_id?: number | string;
  division_id?: number | string;
  is_active?: boolean | string;
  discontinued?: boolean | string;
  ordering?: string;
  page?: number;
  page_size?: number;
}
