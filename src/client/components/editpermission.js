import React, {useState, useContext} from "react";
import { Context } from "../Context";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Table from "react-bootstrap/Table";
import Dropdown from "react-bootstrap/Dropdown";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Modal from 'react-bootstrap/Modal';
import { MdClose, MdAdd } from "react-icons/md";
import "bootstrap/dist/css/bootstrap.min.css";
import "../app.css";
import { useStore } from "../store";
import AxiosClient from "../AxiosClient";

export default function EditPermission(props) {
  const [context, setContext] = useContext(Context);
  const setEditPermission = useStore((state) => state.setEditPermission);
  const selectedFiles = allSelected(props.files);//props.files.filter((e) => e.selected);
  let fileSnapshot = props.fileSnapshot;
  console.log("edit permission page");
  console.log(setEditPermission);
  console.log(selectedFiles);

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
        selected.push(file.children[i]);
      }
    }
  };

  return (
    <div style={{ height: "100vh", borderLeft: "1px solid #CFCFCF" }}>
      <Container fluid className={"no-gutters mx-0 px-0"}>
        <Stack gap={5}>
          <Stack style={{ paddingTop: "4px" }}>
            <Container fluid className={"no-gutters mx-0 px-0"}>
              <MdClose
                size={24}
                style={{ float: "right", color: "#CFCFCF" }}
                onClick={setEditPermission}
              />
            </Container>
            <FilePermission selectedFiles={selectedFiles} clouddrive={context[0]}/>
          </Stack>
          <AddPermission selectedFiles={selectedFiles} fileSnapshot={fileSnapshot} clouddrive={context[0]}/>
          {/* <RemovePermission selectedFiles={selectedFiles}/> */}
        </Stack>
      </Container>
    </div>
  );
}

function FilePermission(props) {
  const selectedFiles = props.selectedFiles;
  const [ role, setRole ] = useState(props.clouddrive === "google" ? "writer" : "write");
  const [ value, setValue ] = useState("");
  const [ updated, setUpdated ] = useState({up: false, id: "", role: ""});
  const [ show, setShow ] = useState(false);
  const [ showEdit, setShowEdit ] = useState(false);
  const [ showDelete, setShowDelete ] = useState(false);
  const [ editUpdate, setEditUpdate ] = useState([]);
  const [ editRemove, setEditRemove ] = useState([]);


  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleCloseEdit = () => setShowEdit(false);
  let handleShowEdit = (e, fileid, permid, permName, permRole, driveid = null) => {
    e.preventDefault();

    setEditUpdate([e, fileid, permid, permName, permRole, driveid]);
    setShowEdit(true);
  } 
  let handleConfirmEdit = () => {
    handleUpdateSharing(editUpdate[0], editUpdate[1], editUpdate[2], editUpdate[3], editUpdate[4], editUpdate[5]);
    setShowEdit(false);
  }

  const handleCloseDelete = () => setShowDelete(false);
  let handleShowDelete = (e, fileid, permid, driveid = null) => {
    e.preventDefault();

    setEditRemove([e, fileid, permid, driveid]);
    setShowDelete(true);
  } 
  let handleConfirmDelete = () => {
    handleDeletePermission(editRemove[0], editRemove[1], editRemove[2], editRemove[3])
    setShowDelete(false);
  }


  let handleDeletePermission = (e, fileid, permid, driveid = null) => {
    e.preventDefault();
    AxiosClient.post('/deletePermission', {
      fileid: fileid,
      permid: permid,
      driveid: driveid,
    }).then((res) => {
      console.log("deleted permissions");
    }).catch();
  }

  let handleUpdateSharing = (e, fileid, permid, permName, permRole, driveid = null) => {
    console.log("update sharing");
    e.preventDefault();
    let fileids = [fileid];
    console.log(fileids);
    console.log(permName);
    console.log(permRole);
    AxiosClient.post('/checkaccesscontrol', {
      files: fileids,
      value: permName,
      role: permRole
    }).then((res) => {
      if (res.data.allowed) {
      AxiosClient.post('/updatePermission', {
        fileid: fileid,
        permid: permid,
        googledata: {"role": permRole},
        onedriveRole: {"roles": [permRole]},
        driveid: driveid,
      }).then((res) => {
        setUpdated({up: true, id: permid, role: permRole});
        console.log("successfully updated permissions!");
      }).catch();
    } else {
      setShow(true);
      console.log("NOT ALLOWED VIA ACCESS CONTROL!")
    }
    }).catch();
  }

  return (
    <Container>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Permission Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>Action Not Allowed via Access Control!</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleClose}>
            Ok, Got it.
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showEdit} onHide={handleCloseEdit}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Edit Permission</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to update this permission?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEdit}>
            No
          </Button>
          <Button variant="primary" onClick={handleConfirmEdit}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showDelete} onHide={handleCloseDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete Permission</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this permission?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDelete}>
            No
          </Button>
          <Button variant="primary" onClick={handleConfirmDelete}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
      <Tabs defaultActiveKey="0" className="mb-0" fill>
        {selectedFiles.map((file, index) => (
          <Tab eventKey={index} title={file.name} key={index}>
            <div
              style={{
                border: "1px solid #CFCFCF",
                borderTop: "0",
                borderBottomLeftRadius: "10px",
                borderBottomRightRadius: "10px",
              }}
            >
              <Table>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #CFCFCF" }}>
                    <td style={{ padding: "4px", paddingLeft: "0px" }}>
                      Access
                    </td>
                  </tr>
                  {file.permissions.map((permission, index) => (
                    <tr key={index}>
                      <td>{permission.name}</td>
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle
                            style={{
                              background: "white",
                              borderColor: "#CFCFCF",
                              color: "black",
                            }}
                          >
                          {updated.up && updated.id === permission.id ? updated.role : permission.permission}
                          </Dropdown.Toggle>
                          {props.clouddrive === "google" ? (
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={(e) => {handleShowEdit(e, file.id, permission.id, permission.email, "writer");/*handleUpdateSharing(e, file.id, permission.id, permission.email, "writer");*/}}>writer</Dropdown.Item>
                            <Dropdown.Item onClick={(e) => {handleShowEdit(e, file.id, permission.id, permission.email, "file");/*handleUpdateSharing(e, file.id, permission.id, permission.email, "file");*/}}>fileOrganizer</Dropdown.Item>
                            <Dropdown.Item onClick={(e) => {handleShowEdit(e, file.id, permission.id, permission.email, "owner");/*handleUpdateSharing(e, file.id, permission.id, permission.email, "owner");*/}}>owner</Dropdown.Item>              
                            <Dropdown.Item onClick={(e) => {handleShowEdit(e, file.id, permission.id, permission.email, "organizer");/*handleUpdateSharing(e, file.id, permission.id, permission.email, "organizer");*/}}>organizer</Dropdown.Item>              
                            <Dropdown.Item onClick={(e) => {handleShowEdit(e, file.id, permission.id, permission.email, "commenter");/*handleUpdateSharing(e, file.id, permission.id, permission.email, "commenter");*/}}>commenter</Dropdown.Item>              
                            <Dropdown.Item onClick={(e) => {handleShowEdit(e, file.id, permission.id, permission.email, "reader");/*handleUpdateSharing(e, file.id, permission.id, permission.email, "reader");*/}}>reader</Dropdown.Item>
                          </Dropdown.Menu>) : 
                          (
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={(e) => {handleShowEdit(e, file.id, permission.id, permission.email, "write", file.driveid);/*handleUpdateSharing(e, file.id, permission.id, permission.email, "write", file.driveid);*/}}>write</Dropdown.Item>
                            <Dropdown.Item onClick={(e) => {handleShowEdit(e, file.id, permission.id, permission.email, "read", file.driveid);/*handleUpdateSharing(e, file.id, permission.id, permission.email, "read", file.driveid);*/}}>read</Dropdown.Item>
                          </Dropdown.Menu>)
                          }
                        </Dropdown>
                      </td>
                      <td>{permission.access}</td>
                      <td>
                        <MdClose onClick={(e) => {handleShowDelete(e, file.id, permission.id, file.driveid)/*handleDeletePermission(e, file.id, permission.id, file.driveid)*/}} size={24} style={{ color: "#CFCFCF" }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Tab>
        ))}
      </Tabs>
    </Container>
  );
}

function AddPermission(props) {

  const selectedFiles = props.selectedFiles;
  const [ role, setRole ] = useState(props.clouddrive === "google" ? "writer" : "write");
  const [ value, setValue ] = useState("");
  const [ showError, setShowError ] = useState(false);
  const [ show, setShow ] = useState(false);
  const [ add, setAdd] = useState(null);
  
  const handleCloseError = () => setShowError(false);
  const handleShowError = () => setShowError(true);

  const handleClose = () => setShow(false);
  const handleShowAdd = (e) => {
    setShow(true);
    setAdd(e);
  }

  let handleConfirmAdd = () => {
    handleNewSharing(add);
    setShow(false);
  }

  let handleNewSharing = (e) => {
    e.preventDefault();
    let fileids = [];
    let driveids = [];
    selectedFiles.forEach((file, index) => {
      fileids.push(file.id);
      driveids.push(file.driveid);
    })
    AxiosClient.post('/checkaccesscontrol', {
      files: fileids,
      value: value,
      role: role
    }).then((res) => {
      if (res.data.allowed) {
      AxiosClient.post('/addpermission', {
        fileList: fileids,
        role: role,
        type: "user",
        value: value,
        driveList: driveids,
      }).then((res) => {
        console.log("successfully added new permission sharing!");
      }).catch();
    } else {
      setShowError(true);
      console.log("NOT ALLOWED VIA ACCESS CONTROL!")
    }
    }).catch();
  }

  return (
    <Container fluid className={"no-gutters"}>
      <Container style={{ border: "1px solid #CFCFCF", borderRadius: "10px" }}>
        <Modal show={showError} onHide={handleCloseError}>
          <Modal.Header closeButton>
            <Modal.Title>Add Permission Error</Modal.Title>
          </Modal.Header>
          <Modal.Body>Action Not Allowed via Access Control!</Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleCloseError}>
              Ok, Got it.
            </Button>
          </Modal.Footer>
        </Modal>
        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Add Permission</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to add this permission?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              No
            </Button>
            <Button variant="primary" onClick={handleConfirmAdd}>
              Yes
            </Button>
          </Modal.Footer>
        </Modal>
        <Row
          style={{
            borderBottom: "1px solid #CFCFCF",
            paddingLeft: "10px",
          }}
        >
          Add People and Groups
        </Row>
        <Stack direction="horizontal" gap={3} className="pt-3">
          <Form.Control onChange={(e) => setValue(e.target.value)} style={{ background: "#E9ECEF" }} />
          <Button onClick={(e) => handleShowAdd(e)/*handleNewSharing(e)*/}
            style={{
              background: "#3484FD",
              borderColor: "#CFCFCF",
              borderRadius: "10px",
              color: "white",
            }}
          >
            Share
          </Button>
        </Stack>
        <Stack direction="horizontal" gap={2} className="pt-2 pb-2">
          <>Permission Type:</>
          <Dropdown>
            <Dropdown.Toggle
              style={{
                background: "white",
                borderColor: "#CFCFCF",
                color: "black",
              }}
            >
              {role}
            </Dropdown.Toggle>
            {props.clouddrive === "google" ? 
            (
          <Dropdown.Menu>
          <Dropdown.Item onClick={() => {setRole("writer")}}>writer</Dropdown.Item>
              <Dropdown.Item onClick={() => {setRole("fileOrganizer")}}>fileOrganizer</Dropdown.Item>
              <Dropdown.Item onClick={() => {setRole("owner")}}>owner</Dropdown.Item>              
              <Dropdown.Item onClick={() => {setRole("organizer")}}>organizer</Dropdown.Item>              
              <Dropdown.Item onClick={() => {setRole("commenter")}}>commenter</Dropdown.Item>              
              <Dropdown.Item onClick={() => {setRole("reader")}}>reader</Dropdown.Item>
          </Dropdown.Menu>
            ) : 
            (
              <Dropdown.Menu>
              <Dropdown.Item onClick={() => {setRole("write")}}>write</Dropdown.Item>            
              <Dropdown.Item onClick={() => {setRole("read")}}>read</Dropdown.Item>
              </Dropdown.Menu>
            )
          }
          </Dropdown>
        </Stack>
      </Container>
    </Container>
  );
}

function RemovePermission(props) {

  const selectedFiles = props.selectedFiles;
  const [ value, setValue ] = useState("");
  
  let removeSharing = (e) => {
    e.preventDefault();
    let fileids = [];
    selectedFiles.forEach((file, index) => {
      fileids.push(file.id);
    })
    // get list of permissions of a file containing a specific email
    // remove the list of permissions

    // AxiosClient.post('/checkaccesscontrol', {
    //   files: fileids,
    //   value: value,
    //   role: role
    // }).then((res) => {
    //   if (res.data.allowed) {
    //   AxiosClient.post('/addpermission', {
    //     fileList: fileids,
    //     role: role,
    //     type: "user",
    //     value: value,
    //   }).then((res) => {
    //     console.log("successfully added new permission sharing!");
    //   }).catch();
    // } else {
    //   console.log("NOT ALLOWED VIA ACCESS CONTROL!")
    // }
    // }).catch();
  }

  return (
    <Container fluid className={"no-gutters"}>
      <Container style={{ border: "1px solid #CFCFCF", borderRadius: "10px" }}>
        <Row
          style={{
            borderBottom: "1px solid #CFCFCF",
            paddingLeft: "10px",
          }}
        >
          Remove People and Groups
        </Row>
        <Stack direction="horizontal" gap={3} className="pt-3 pb-3">
          <Form.Control onChange={(e) => setValue(e.target.value)} style={{ background: "#E9ECEF" }} />
          <Button
            style={{
              background: "#F06B6B",
              borderColor: "#CFCFCF",
              borderRadius: "10px",
              color: "white",
            }}
            onClick={removeSharing}
          >
            Remove
          </Button>
        </Stack>
      </Container>
    </Container>
  );
}
