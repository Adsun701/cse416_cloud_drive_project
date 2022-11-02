import React, { useContext, useState, useEffect } from "react";
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

export default function SearchPage() {
  const navigate = useNavigate();

  const [context, setContext] = useContext(Context);
  const [files, setFiles] = useState([]);
  const [fileSnapshots, setFileSnapshots] = useState([]);
  const [groupSnapshots, setGroupSnapshots] = useState([]);
  console.log("CONTEXT");
  console.log(context);
  console.log("CONTEXT FIN");

  const editPermission = useStore((state) => state.editPermission);

  const handleFail = (err) => {
    console.log("failed operation: ", err);
  };

  const location = useLocation();
  let allFiles = [];
  let allFileSnapshots = [];
  let allGroupSnapshots = [];
  if (location.state) {
    for (let i = 0; i < location.state.files.length; i++) {
      let file = location.state.files[i];
      if (file == null) continue;

      let permissionsArray = [];
      if (file.permissions) {
        for (let j = 0; j < file.permissions.length; j++) {
          let entry = {
            id: file.permissions[j].id,
            name: file.permissions[j].displayName,
            permission: (file?.permissions[j]?.roles) ? (file?.permissions[j]?.roles[0]) : "None",
            access:
              file.permissions[j].inheritedFrom == null
                ? "Direct"
                : "Inherited",
            expanded: false,
          };
          permissionsArray.push(entry);
        }
      }

      let newFile = {
        id: file.id,
        selected: false,
        expanded: false,
        name: file.name,
        owner: "",
        type: "",
        lastModified: new Date(file.modifiedTime).toLocaleString(),
        created: new Date(file.createdTime).toLocaleString(),
        permissions: permissionsArray,
      };
      allFiles.push(newFile);
    }
    allFiles.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
    for (let i = 0; i < location.state.fileSnapshots.length; i++) {
      let snapshot = {
        id: i + 1,
        createdAt: location.state.fileSnapshots[i].createdAt,
        timestamp: new Date(location.state.fileSnapshots[i].createdAt),
        selected: false,
      };
      allFileSnapshots.push(snapshot);
    }
    for (let i = 0; i < location.state.groupSnapshots.length; i++) {
      allGroupSnapshots[location.state.groupSnapshots[i].groupName] = location.state.groupSnapshots[i].groupMembers;
    }
  }

  useEffect(() => {
    setFiles(allFiles);
    setFileSnapshots(allFileSnapshots);
    setGroupSnapshots(allGroupSnapshots);
  }, []);

  return (
    <div>
      <Header />
      <Container fluid className={"no-gutters mx-0 px-0"}>
        <div className="row no-gutters">
          <Row className="no-gutters">
            {editPermission && files.filter((e) => e.selected).length > 0 ? (
              <>
                <Col sm={1} className="px-0">
                  <SideBar />
                </Col>
                <Col sm={7} className="px-0">
                  <DataTable 
                    files={files} 
                    setFiles={setFiles} 
                    fileSnapshots={fileSnapshots} 
                    setFileSnapshots={setFileSnapshots}
                    groupSnapshots={groupSnapshots} 
                    setGroupSnapshots={setGroupSnapshots}/>
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
                  <DataTable
                    files={files} 
                    setFiles={setFiles} 
                    fileSnapshots={fileSnapshots} 
                    setFileSnapshots={setFileSnapshots}
                    groupSnapshots={groupSnapshots} 
                    setGroupSnapshots={setGroupSnapshots}/>
                </Col>
              </>
            )}
          </Row>
        </div>
      </Container>
    </div>
  );
}
