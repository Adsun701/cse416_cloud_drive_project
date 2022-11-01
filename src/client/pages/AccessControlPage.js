import React, { useState, useEffect } from "react";
import Header from '../components/header';
import SideBar from "../components/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import AxiosClient from "../AxiosClient";

export default function AccessControlPage() {

  const [accesscontrols, setAccessControls] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      const response = await AxiosClient.get("/getaccesscontrolpolicies");
      setAccessControls(response);
    }
    fetchData();
  }, []);

  return (
    <div>
        <Header/>
        <SideBar/>
        <h2>Access Control Policies</h2>
        
                
    </div>
  );
}
