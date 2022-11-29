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

  const editPermission = useStore((state) => state.editPermission);

  const handleFail = (err) => {
    console.log("failed operation: ", err);
  };

  // retrieve the states passed from previous page, if there are any
  const location = useLocation();
  let allFiles = [];
  let allFileSnapshots = [];
  let allGroupSnapshots = [];
  if (location.state) {
    // Get the files from the state and extract the information needed to be passed as props to datatable component
    for (let i = 0; i < location.state.files.length; i++) {
      let file = location.state.files[i];
      if (file == null) continue;
      console.log(file);
      let permissionsArray = [];
      if (file.permissions) {
        for (let j = 0; j < file.permissions.length; j++) {
          let entry = {
            id: file.permissions[j].id,
            name: file.permissions[j].displayName,
            email: file.permissions[j].email,
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

      let owner;
      if (file.owner) {
        owner = {
          name: file.owner.name,
          email: file.owner.email
        }
      }

      let newFile = {
        id: file.id,
        selected: false,
        expanded: false,
        showFolder: false,
        name: file.name,
        owner: owner,
        drive: file.drive,
        lastModified: new Date(file.modifiedTime).toLocaleString(),
        created: new Date(file.createdTime).toLocaleString(),
        permissions: permissionsArray,
        folder: file.folder,
        children: getNestedChildren(file),
        driveid: file.shared.driveId,
      };
      allFiles.push(newFile);
    }
    // sort the files alphabetically
    allFiles.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));

    // Get the file snapshots from the state and extract the information needed to be passed as props to datatable component
    for (let i = 0; i < location.state.fileSnapshots.length; i++) {
      let snapshot = {
        id: i + 1,
        createdAt: location.state.fileSnapshots[i].createdAt,
        timestamp: new Date(location.state.fileSnapshots[i].createdAt),
        selected: false,
      };
      allFileSnapshots.push(snapshot);
    }

    // Get the group snapshots from the state and extract the information needed to be passed as props to datatable component
    for (let i = 0; i < location.state.groupSnapshots.length; i++) {
      if (!allGroupSnapshots[location.state.groupSnapshots[i].groupName]) {
        allGroupSnapshots[location.state.groupSnapshots[i].groupName] = location.state.groupSnapshots[i].groupMembers;
      }
    }
  }

  function getNestedChildren(file) {
    let files = [];
    let children = []
    for (let i = 0; i < file.children.length; i++) {
      if (file.children[i].folder) {
        children = getNestedChildren(file.children[i]);
      }
      let nestedFile = {
        id: file.children[i].id,
        selected: false,
        expanded: false,
        showFolder: false,
        name: file.children[i].name,
        owner: file.children[i].owner,
        drive: file.children[i].drive,
        lastModified: new Date(file.children[i].modifiedTime).toLocaleString(),
        created: new Date(file.children[i].createdTime).toLocaleString(),
        permissions: getPermissions(file.children[i]),
        folder: file.children[i].folder,
        children: children,
        driveid: file.shared.driveId,
      }
      files.push(nestedFile);
    }
    return files;
  }

  function getPermissions(file) {
    let permissionsArray = [];
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
    return permissionsArray;
  }

  useEffect(() => {
    setFiles(allFiles);
    setFileSnapshots(allFileSnapshots);
    setGroupSnapshots(allGroupSnapshots);
  }, []);

  function allSelected(files) {
    let selected = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].folder) {
        nestedSelectedFiles(files[i], selected);
      }
      if (files[i].selected) {
        selected.push(files[i]);
      }
    }
    return selected;
  };

  function nestedSelectedFiles(file, selected){
    for (let i = 0; i < file.children.length; i++) {
      if (file.children[i].folder) {
        nestedSelectedFiles(file.children[i], selected);
      }
      if (file.children[i].selected) {
        console.log(file.children[i]);
        selected.push(file.children[i]);
      }
    }
  };

  return (
    <div>
      <Header />
      <Container fluid className={"no-gutters mx-0 px-0"}>
        <div className="row no-gutters">
          <Row className="no-gutters">
            {editPermission && allSelected(files).length > 0 ? (
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
                  <EditPermission files={files} fileSnapshots={fileSnapshots}/>
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
