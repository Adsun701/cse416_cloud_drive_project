import React, { useContext, useState } from "react";
import { Context } from "../Context";
import Header from "../components/header";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useNavigate } from "react-router-dom";
import SideBar from "../components/sidebar";
import DataTable from "../components/datatable";
import EditPermission from "../components/editpermission";
import { useStore } from "../store";
import { gapi } from "gapi-script";
import axios from "axios";

export default function SearchPage() {
  const [context, setContext] = useContext(Context);
  console.log("CONTEXT");
  console.log(context);
  console.log("CONTEXT FIN");

  const editPermission = useStore((state) => state.editPermission);

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
      permissions: [
        "(name of person/group, current permission, inherited/direct)",
        "(name_of_person, edit, assigned)",
        "(name_of_person, edit, assigned)",
      ],
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
      permissions: [
        "(name of person/group, current permission, inherited/direct)",
        "(name_of_person, edit, assigned)",
        "(name_of_person, edit, assigned)",
      ],
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
      permissions: [
        "(name of person/group, current permission, inherited/direct)",
        "(name_of_person, edit, assigned)",
        "(name_of_person, edit, assigned)",
      ],
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
      permissions: [
        "(name of person/group, current permission, inherited/direct)",
        "(name_of_person, edit, assigned)",
      ],
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
      permissions: [
        "(name of person/group, current permission, inherited/direct)",
      ],
    },
  ];

  gapi.load("client:auth2", () => {
    gapi.client.init({
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive",
    });
  });

  const navigate = useNavigate();

  const client = axios.create({
    baseURL: "http://localhost:8080",
  });

  const handleFail = (err) => {
    console.log("failed operation: ", err);
  };

  return (
    <div>
      <Header />
      <Container fluid className={"no-gutters mx-0 px-0"}>
        <div className="row no-gutters">
          <Row className="no-gutters">
            {editPermission ? (
              <>
                <Col sm={1} className="px-0">
                  <SideBar />
                </Col>
                <Col sm={7} className="px-0">
                  <DataTable fileData={fileData} />
                </Col>
                <Col sm={4} className="px-0">
                  <EditPermission />
                </Col>
              </>
            ) : (
              <>
                <Col sm={2} className="px-0">
                  <SideBar />
                </Col>
                <Col sm={10} className="px-0">
                  <DataTable fileData={fileData} />
                </Col>
              </>
            )}
          </Row>
        </div>
      </Container>
    </div>
  );
}
