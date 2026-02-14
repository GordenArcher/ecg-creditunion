export interface ProfileData {
  id: number;
  email: string;
  employee_id: string;
  staff_id: string;
  full_name: string;
  title: string;
  station: {
    id: string;
    code: string;
    name: string;
  } | null;
  division: {
    id: string;
    code: string;
    name: string;
    directorate?: string;
  } | null;
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
  pb_number?: string;
}
