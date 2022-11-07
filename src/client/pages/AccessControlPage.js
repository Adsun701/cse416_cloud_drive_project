import React, { useState, useEffect } from "react";
import Header from "../components/header";
import SideBar from "../components/sidebar";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";
import Form from 'react-bootstrap/Form';
import Stack from 'react-bootstrap/Stack';
import { MdEdit, MdAdd, MdClose } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import AxiosClient from "../AxiosClient";

export default function AccessControlPage() {
  let [accesscontrols, setAccessControls] = useState([]);
  let [accessControlChanged, setAccessControlChanged] = useState(0);
  let [change, setChange] = useState(0);
  let [policy, setPolicy] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [requirementStr, setRequirementStr] = useState("");
  const [arStr, setarStr] = useState("");
  const [awStr, setawStr] = useState("");
  const [drStr, setdrStr] = useState("");
  const [dwStr, setdwStr] = useState("");
  const [newEdit, setNewEditValue] = useState("");
  const [newValue, setNewValue] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      AxiosClient.get("/getaccesscontrolpolicies").then((response) => {
        console.log(response.data);
        setAccessControls(response.data);
        console.log("access controls");
        console.log(accesscontrols);
      });
    }
    fetchData();
  }, [accessControlChanged]);

  let fetchData = async () => {
    AxiosClient.get("/getaccesscontrolpolicies")
      .then((response) => {
        console.log(response.data);
        setAccessControls(response.data);
        setChange(change + 1);
      })
      .catch();
  };

  let handleAddNewAccessControl = async (e) => {
    setShowForm(false);
    e.preventDefault();
    AxiosClient.post("/addnewaccesscontrolpolicies", {
      requirement: requirementStr,
      ar: arStr,
      dr: drStr,
      aw: awStr,
      dw: dwStr,
    })
      .then(setAccessControlChanged(accessControlChanged + 1))
      .catch();
  };

  let handleDeleteRequirement = async (requirement) => {
    AxiosClient.post("/deleteaccesscontrolpolicy", {
      requirement: requirement,
    })
      .then((res) => {
        setAccessControlChanged(accessControlChanged + 1);
      })
      .catch();
  };

  let handleAddUpdateAccessControl = async (e, requirement, type) => {
    AxiosClient.post("/updateaccesscontrolpolicy", {
      requirement: requirement,
      type: type,
      newValue: newValue,
    })
      .then((res) => {
        setAccessControlChanged(accessControlChanged + 1);
        fetchData();
        e.target.value = "";
        setNewValue("");
      })
      .catch();
  };

  let handleEditAccessControl = async (requirement, type, prevControl) => {
    AxiosClient.post("/editaccesscontrol", {
      requirement: requirement,
      type: type,
      prevControl: prevControl,
      newControl: newEdit,
    })
      .then((res) => {
        setAccessControlChanged(accessControlChanged + 1);
        fetchData();
        setNewEditValue("");
      })
      .catch();
  };

  let handleDeleteSingleAccessControl = async (requirement, type, prevControl) => {
    AxiosClient.post("/deleteoneaccesscontrolpolicy", {
      requirement: requirement,
      type: type,
      prevControl: prevControl,
    })
      .then((res) => {
        setAccessControlChanged(accessControlChanged + 1);
        fetchData();
      })
      .catch();
  };

  let handleAddRequirement = () => {
    setShowForm(true);
  };

  let handleClose = () => {
    setShowForm(false);
  };

  let handleEdit = (policy) => {
    setShowEdit(true);
    setPolicy(policy);
  }

  let handleCloseEdit = () => {
    setShowEdit(false);
  };

  return (
    <div>
      <Header />
      <Container fluid className={"no-gutters mx-0 px-0"}>
        <div className="row no-gutters">
          <Row className="no-gutters">
            <Col sm={2} className="px-0">
              <SideBar />
            </Col>
            <Col>
              <h5
                style={{
                  textAlign: "left",
                  padding: "25px",
                  paddingLeft: "0px",
                  fontWeight: "normal",
                  borderBottom: "1px solid #CFCFCF",
                }}
              >
                Access Control Policies
              </h5>
              <div style={{ textAlign: "right", marginTop: "10px" }}>
                <Button
                  style={{
                    background: "#3484FD",
                    borderColor: "#CFCFCF",
                    borderRadius: "30px",
                    color: "white",
                  }}
                  onClick={handleAddRequirement}
                >
                  <MdAdd />
                  Add Requirement
                </Button>
              </div>
              <Table
                style={{
                  textAlign: "left",
                  marginTop: "10px",
                  border: "1px solid #CFCFCF",
                }}
              >
                <thead style={{ borderTop: "1px solid #CFCFCF" }}>
                  <tr>
                    <th>Requirement</th>
                    <th>Allowed Readers</th>
                    <th>Denied Readers</th>
                    <th>Allowed Writers</th>
                    <th>Denied Writers</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {accesscontrols.map((policy) => (
                    <tr key={policy._id}>
                      <td>{policy.requirement}</td>
                      <td>
                        {policy.ar.map((ar) => (
                          <ListGroup>
                            {ar != "" && (
                              <ListGroup.Item
                                style={{
                                  border: "0",
                                  paddingLeft: "0px",
                                  paddingRight: "0px",
                                }}
                              >
                                <span
                                  style={{
                                    backgroundColor: "#EAEAEA",
                                    borderRadius: "40px",
                                    padding: "4px",
                                    paddingLeft: "10px",
                                    paddingRight: "10px",
                                  }}
                                >
                                  {ar}
                                </span>
                              </ListGroup.Item>
                            )}
                          </ListGroup>
                        ))}
                      </td>
                      <td>
                        {policy.dr.map((dr) => (
                          <ListGroup>
                            {dr != "" && (
                              <ListGroup.Item
                                style={{
                                  border: "0",
                                  paddingLeft: "0px",
                                  paddingRight: "0px",
                                }}
                              >
                                <span
                                  style={{
                                    backgroundColor: "#EAEAEA",
                                    borderRadius: "40px",
                                    padding: "4px",
                                    paddingLeft: "10px",
                                    paddingRight: "10px",
                                  }}
                                >
                                  {dr}
                                </span>
                              </ListGroup.Item>
                            )}
                          </ListGroup>
                        ))}
                      </td>
                      <td>
                        {policy.aw.map((aw) => (
                          <ListGroup>
                            {aw != "" && (
                              <ListGroup.Item
                                style={{
                                  border: "0",
                                  paddingLeft: "0px",
                                  paddingRight: "0px",
                                }}
                              >
                                <span
                                  style={{
                                    backgroundColor: "#EAEAEA",
                                    borderRadius: "40px",
                                    padding: "4px",
                                    paddingLeft: "10px",
                                    paddingRight: "10px",
                                  }}
                                >
                                  {aw}
                                </span>
                              </ListGroup.Item>
                            )}
                          </ListGroup>
                        ))}
                      </td>
                      <td>
                        {policy.dw.map((dw) => (
                          <ListGroup>
                            {dw != "" && (
                              <ListGroup.Item
                                style={{
                                  border: "0",
                                  paddingLeft: "0px",
                                  paddingRight: "0px",
                                }}
                              >
                                <span
                                  style={{
                                    backgroundColor: "#EAEAEA",
                                    borderRadius: "40px",
                                    padding: "4px",
                                    paddingLeft: "10px",
                                    paddingRight: "10px",
                                  }}
                                >
                                  {dw}
                                </span>
                              </ListGroup.Item>
                            )}
                          </ListGroup>
                        ))}
                      </td>
                      <td>
                        <MdEdit style={{ color: "#CFCFCF" }} onClick={() => handleEdit(policy)} />
                        <MdClose size="20px" style={{ color: "#CFCFCF" }} onClick={() => handleDeleteRequirement(policy.requirement)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Modal show={showForm} onHide={handleClose} centered>
                <Modal.Header closeButton>
                  <Modal.Title>Add New Access Control</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form style={{ textAlign: "left" }}>
                    <Form.Group className="mb-3" controlId="requirement">
                      <Form.Label>Requirement:</Form.Label>
                      <Form.Control placeholder="Requirement" value={requirementStr} onChange={(event) => setRequirementStr(event.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="ar">
                      <Form.Label>Allowed Readers:</Form.Label>
                      <Form.Control placeholder="Allowed readers" value={arStr} onChange={(event) => setarStr(event.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="dr">
                      <Form.Label>Denied Readers:</Form.Label>
                      <Form.Control placeholder="Denied readers" value={drStr} onChange={(event) => setdrStr(event.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="aw">
                      <Form.Label>Allowed Writers:</Form.Label>
                      <Form.Control placeholder="Allowed writers" value={awStr} onChange={(event) => setawStr(event.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="dw">
                      <Form.Label>Denied Writers:</Form.Label>
                      <Form.Control placeholder="Denied writers" value={dwStr} onChange={(event) => setdwStr(event.target.value)} />
                    </Form.Group>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="primary" onClick={handleAddNewAccessControl}>
                    Submit
                  </Button>
                </Modal.Footer>
              </Modal>
              <Modal show={showEdit} onHide={handleCloseEdit} centered dialogClassName="modal-90w">
                <Modal.Header closeButton>
                  <Modal.Title>Edit Access Control</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ textAlign: "left" }}>
                  <h5 style={{ marginBottom: "15px" }}>Requirement: {policy.requirement}</h5>
                  <p style={{ marginBottom: "3px" }}>Allowed Readers</p>
                  <Form.Group controlId="ar" style={{ maxHeight: "130px", overflowX: "hide", overflowY: "auto" }}>
                      {policy.ar?.map((ar) => 
                        <Stack direction="horizontal" gap={1}>
                          <Form.Control style={{ marginTop: "5px" }} placeholder="Allowed readers" value={ar} onChange={(e) => setNewEditValue(e.target.value)} />
                          <Button style={{ marginTop: "5px" }} onClick={() => handleEditAccessControl(policy.requirement, "ar", ar)}>Edit</Button>
                          <Button style={{ marginTop: "5px", marginRight: "5px" }} onClick={() => handleDeleteSingleAccessControl(policy.requirement, "ar", ar)}>Delete</Button>
                        </Stack>
                      )}
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Stack direction="horizontal" gap={1}>
                      <Form.Control style={{ marginTop: "5px" }} placeholder="Allowed readers" onChange={(e) => setNewValue(e.target.value)} />
                      <Button style={{ marginTop: "5px" }} onClick={(e) => handleAddUpdateAccessControl(e, policy.requirement, "ar")}>Add</Button>
                    </Stack>
                  </Form.Group>
                  <p style={{ marginBottom: "3px" }}>Denied Readers</p>
                  <Form.Group controlId="dr" style={{ maxHeight: "130px", overflowX: "hide", overflowY: "auto" }}>
                      {policy.dr?.map((dr) => 
                        <Stack direction="horizontal" gap={1}>
                          <Form.Control style={{ marginTop: "5px" }} placeholder="Denied readers" value={dr} onChange={(e) => setNewEditValue(e.target.value)} />
                          <Button style={{ marginTop: "5px" }} onClick={() => handleEditAccessControl(policy.requirement, "dr", dr)}>Edit</Button>
                          <Button style={{ marginTop: "5px", marginRight: "5px" }} onClick={() => handleDeleteSingleAccessControl(policy.requirement, "dr", dr)}>Delete</Button>
                        </Stack>
                      )}
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Stack direction="horizontal" gap={1}>
                      <Form.Control style={{ marginTop: "5px" }} placeholder="Denied readers" onChange={(e) => setNewValue(e.target.value)} />
                      <Button style={{ marginTop: "5px" }} onClick={(e) => handleAddUpdateAccessControl(e, policy.requirement, "dr")}>Add</Button>
                    </Stack>
                  </Form.Group>
                  <p style={{ marginBottom: "3px" }}>Allowed Writers</p>
                  <Form.Group controlId="aw" style={{ maxHeight: "130px", overflowX: "hide", overflowY: "auto" }}>
                      {policy.aw?.map((aw) => 
                        <Stack direction="horizontal" gap={1}>
                          <Form.Control style={{ marginTop: "5px" }} placeholder="Allowed writers" value={aw} onChange={(e) => setNewEditValue(e.target.value)} />
                          <Button style={{ marginTop: "5px" }} onClick={() => handleEditAccessControl(policy.requirement, "aw", aw)}>Edit</Button>
                          <Button style={{ marginTop: "5px", marginRight: "5px" }} onClick={() => handleDeleteSingleAccessControl(policy.requirement, "aw", aw)}>Delete</Button>
                        </Stack>
                      )}
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Stack direction="horizontal" gap={1}>
                      <Form.Control style={{ marginTop: "5px" }} placeholder="Allowed writers" onChange={(e) => setNewValue(e.target.value)} />
                      <Button style={{ marginTop: "5px" }} onClick={(e) => handleAddUpdateAccessControl(e, policy.requirement, "aw")}>Add</Button>
                    </Stack>
                  </Form.Group>
                  <p style={{ marginBottom: "3px" }}>Denied Writers</p>
                  <Form.Group controlId="dw" style={{ maxHeight: "130px", overflowX: "hide", overflowY: "auto" }}>
                      {policy.dw?.map((dw) => 
                        <Stack direction="horizontal" gap={1}>
                          <Form.Control style={{ marginTop: "5px" }} placeholder="Denied Writers" value={dw} onChange={(e) => setNewEditValue(e.target.value)} />
                          <Button style={{ marginTop: "5px" }} onClick={() => handleEditAccessControl(policy.requirement, "dw", dw)}>Edit</Button>
                          <Button style={{ marginTop: "5px", marginRight: "5px" }} onClick={() => handleDeleteSingleAccessControl(policy.requirement, "dw", dw)}>Delete</Button>
                        </Stack>
                      )}
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Stack direction="horizontal" gap={1}>
                      <Form.Control style={{ marginTop: "5px" }} placeholder="Denied writers" onChange={(e) => setNewValue(e.target.value)} />
                      <Button style={{ marginTop: "5px" }} onClick={(e) => handleAddUpdateAccessControl(e, policy.requirement, "dw")}>Add</Button>
                    </Stack>
                  </Form.Group>
                </Modal.Body>
              </Modal>
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  );
}
