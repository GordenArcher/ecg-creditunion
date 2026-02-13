import type { PasswordForm } from "../types/types";
import axiosClient from "../utils/axios";

const login_user = async (email: string, password: string) => {
  if (!email || !password) return;
  const response = await axiosClient.post("/users/auth/login/", {
    email,
    password,
  });

  return response;
};

export default login_user;

export const GetUser = async () => {
  const response = await axiosClient.get("/users/profile/");

  return response.data;
};

export const checkAuth = async () => {
  const response = await axiosClient.get("/users/auth/is_authenticated/");

  return response.data;
};

export const fetchAllEmployees = async (cleanParams) => {
  const response = await axiosClient.get("/users/admin/employees/", {
    params: cleanParams,
  });

  return response.data;
};

export const fetchStations = async () => {
  const response = await axiosClient.get("/users/stations/list/");
  return response.data;
};

export const fetchDivisions = async () => {
  const response = await axiosClient.get("/users/divisions/list/");
  return response.data;
};

export const AddEmployeesViaExcel = async (file: File) => {
  const formData = new FormData();
  formData.append("excel_file", file);

  const response = await axiosClient.post(
    "/users/admin/users/upload/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const fetchAuditLogs = async () => {
  const response = await axiosClient.get("/audit/logs/?page=1&page_size=10");
  return response.data;
};

export const fetchAuditLogDetail = async (id: string) => {
  if (!id) return;
  const response = await axiosClient.get(`/audit/logs/${id}/`);
  return response.data;
};

export const ChangeUserPassword = async (values: PasswordForm) => {
  if (
    !values.current_password ||
    !values.new_password ||
    !values.confirm_password
  )
    return;
  const response = await axiosClient.post(
    "/users/profile/change-password/",
    values,
  );

  return response;
};
