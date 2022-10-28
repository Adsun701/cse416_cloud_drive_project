import axios from "axios";

const AxiosClient = axios.create({
    baseURL: "http://localhost:8080",
    withCredentials: true,
    credentials: 'include',
  });

export default AxiosClient;