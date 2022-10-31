import React from "react";
import Nav from "react-bootstrap/Nav";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../app.css";
import AxiosClient from "../AxiosClient";

export default function SideBar() {
  const navigate = useNavigate();

  let handleFileSnapshot = () => {
    AxiosClient.get("/filesnapshot");
  };

  const handleGroupSnapshot = () => {
    navigate('/group');
  };

  const handleSearch = () => {
    AxiosClient.get("/google/last15modifiedfiles").then((res) => {
      navigate("/search", { state: { files: res.data }} );
    });
  };

  const handleSnapshot = () => {
    navigate("/snapshot");
  };

  return (
    <div style={{ padding: "20px" }}>
      <Nav
        defaultActiveKey="/home"
        className="flex-column"
        style={{ textAlign: "left" }}
      >
        <Dropdown>
          <Dropdown.Toggle
            style={{
              background: "white",
              borderColor: "#CFCFCF",
              borderRadius: "30px",
              color: "#3A3A3A",
            }}
          >
            Add Snapshot
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item onClick={handleFileSnapshot}>File Snapshot</Dropdown.Item>
            <Dropdown.Item onClick={handleGroupSnapshot}>Group Snapshot</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <Nav.Link onClick={handleSearch} style={{ color: "#3A3A3A" }}>
          Search
        </Nav.Link>
        <Nav.Link onClick={handleSnapshot} style={{ color: "#3A3A3A" }}>
          Snapshot
        </Nav.Link>
      </Nav>
    </div>
  );
}
