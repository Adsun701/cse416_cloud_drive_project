import React, { useContext, useState } from "react";
import { Context } from "../Context";
import Header from "../components/header";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import SideBar from "../components/sidebar";
import DataTable from "../components/datatable";
import { useStore } from "../store";

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

  return (
    <div>
      <Header />
      <Container fluid className={"no-gutters mx-0 px-0"}>
        <div class="row no-gutters">
          <Row noGutters={true}>
            <Col sm={2}>
              <SideBar />
            </Col>
            <Col sm={10}>
              <DataTable fileData={fileData} />
            </Col>
            {editPermission && <div>EDIT PERMISSION HERE</div>}
          </Row>
        </div>
      </Container>
    </div>
  );
}
