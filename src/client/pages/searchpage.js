import React, { useContext, useState } from "react";
import { Context } from "../Context";
import Header from "../components/header";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useNavigate, useLocation } from "react-router-dom";
import SideBar from "../components/sidebar";
import DataTable from "../components/datatable";
import EditPermission from "../components/editpermission";
import { useStore } from "../store";
import { gapi } from "gapi-script";
import axios from "axios";

export default function SearchPage() {
  /*
  gapi.load("client:auth2", () => {
    gapi.client.init({
      clientId:
        process.env.REACT_APP_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive',
    });
  });*/
  
  const navigate = useNavigate();

  const client = axios.create({
    baseURL: "http://localhost:8080"
  });


  const [context, setContext] = useContext(Context);
  console.log("CONTEXT");
  console.log(context);
  console.log("CONTEXT FIN");

  const editPermission = useStore((state) => state.editPermission);

  const permissionData = [
    {
      id: 1,
      name: "Person 1",
      permission: "Owner",
      access: "Direct",
    },
    {
      id: 2,
      name: "Person 2",
      permission: "Editor",
      access: "Direct",
    },
    {
      id: 3,
      name: "Person 3",
      permission: "Reader",
      access: "Direct",
    },
    {
      id: 4,
      name: "Person 4",
      permission: "Viewer",
      access: "Inherited",
    },
    {
      id: 5,
      name: "Person 5",
      permission: "Viewer",
      access: "Inherited",
    },
    {
      id: 6,
      name: "Person 6",
      permission: "Viewer",
      access: "Inherited",
    },
  ];

  const fileData = [
    {
      id: 1,
      selected: false,
      expanded: false,
      name: "Folder 1",
      owner: "Owner",
      type: "Type",
      lastModified: "Last modified",
      created: "Created",
      permissions: permissionData
    },
    {
      id: 2,
      selected: false,
      expanded: false,
      name: "Folder 2",
      owner: "Owner",
      type: "Type",
      lastModified: "Last modified",
      created: "Created",
      permissions: permissionData
    },
    {
      id: 3,
      selected: false,
      expanded: false,
      name: "Folder 3",
      owner: "Owner",
      type: "Type",
      lastModified: "Last modified",
      created: "Created",
      permissions: permissionData
    },
    {
      id: 4,
      selected: false,
      expanded: false,
      name: "Folder 4",
      owner: "Owner",
      type: "Type",
      lastModified: "Last modified",
      created: "Created",
      permissions: permissionData
    },
    {
      id: 5,
      selected: false,
      expanded: false,
      name: "Folder 5",
      owner: "Owner",
      type: "Type",
      lastModified: "Last modified",
      created: "Created",
      permissions: permissionData
    },
  ];

  const handleFail = (err) => {
    console.log("failed operation: ", err);
  };

  const [files, setFiles] = useState(fileData);

  return (
    <div>
      <Header />
      <Container fluid className={"no-gutters mx-0 px-0"}>
        <div className="row no-gutters">
          <Row className="no-gutters">
            {editPermission && (files.filter((e) => e.selected).length > 0) ? (
              <>
                <Col sm={1} className="px-0">
                  <SideBar />
                </Col>
                <Col sm={7} className="px-0">
                  <DataTable files={files} setFiles={setFiles}/>
                </Col>
                <Col sm={4} className="px-0">
                  <EditPermission files={files} />
                </Col>
              </>
            ) : (
              <>
                <Col sm={2} className="px-0">
                  <SideBar />
                </Col>
                <Col sm={10} className="px-0">
                  <DataTable files={files} setFiles={setFiles}/>
                </Col>
              </>
            )}
          </Row>
        </div>
      </Container>
    </div>
  );
}
