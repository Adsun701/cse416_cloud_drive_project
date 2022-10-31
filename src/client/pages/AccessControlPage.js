import React from "react";
import Header from '../components/header';
import Container from "react-bootstrap/Container";
import SideBar from "../components/sidebar";
import DataTable from "../components/datatable";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useNavigate, useLocation } from "react-router-dom";

export default function AccessControlPage() {
  return (
    <div>
        <Header/>
        <SideBar/>
    </div>
  );
}
