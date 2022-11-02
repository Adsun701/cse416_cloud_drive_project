import React, { useContext } from "react";
import { Context } from "../Context";
import Nav from "react-bootstrap/Nav";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../app.css";
import AxiosClient from "../AxiosClient";

export default function SideBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [context, setContext] = useContext(Context);

  let handleFileSnapshot = () => {
    AxiosClient.get("/filesnapshot");
  };

  const handleGroupSnapshot = () => {
    navigate('/group');
  };

  const handleSearch = () => {
    // Get files, file snapshots and group snapshots stored in database, pass them to the search page as state when navigating
    AxiosClient.get("/allfilesnapshots").then((res) => {
      let fileSnapshots = res.data;
      AxiosClient.get("/allgroupsnapshots").then((res) => {
        let groupSnapshots = res.data;
        AxiosClient.get("/allFiles").then((res) => {
          navigate("/search", { state: { files: res.data, fileSnapshots: fileSnapshots, groupSnapshots: groupSnapshots }} );
        });
      });
    });
  };

  const handleSnapshot = () => {
    // Get file snapshots and group snapshots stored in database, pass them to the snapshot page as state when navigating
    AxiosClient.get("/allfilesnapshots").then((res) => {
      let fileSnapshots = res.data;
      AxiosClient.get("/allgroupsnapshots").then((res) => {
        navigate("/snapshot", { state: { fileSnapshots: fileSnapshots, groupSnapshots: res.data}} );
      });
    });
  };

  let handleAccessControl = () => {
    navigate("/accesscontrol");
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
            <Dropdown.Item hidden={context[0] === "google" ? false : true} onClick={handleGroupSnapshot}>Group Snapshot</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <Nav.Link hidden={location.pathname === "/search" ? true : false} onClick={handleSearch} style={{ color: "#3A3A3A" }}>
          Search
        </Nav.Link>
        <Nav.Link hidden={location.pathname === "/snapshot" ? true : false} onClick={handleSnapshot} style={{ color: "#3A3A3A" }}>
          Snapshot
        </Nav.Link>
        <Nav.Link hidden={location.pathname === "/accesscontrol" ? true : false} onClick={handleAccessControl} style={{ color: "#3A3A3A" }}>
          Access Control Policies
        </Nav.Link>
      </Nav>
    </div>
  );
}
