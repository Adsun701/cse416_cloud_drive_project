import React from "react";
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
import { MdClose, MdAdd } from "react-icons/md";
import "bootstrap/dist/css/bootstrap.min.css";
import "../app.css";
import { useStore } from "../store";

export default function EditPermission(props) {
  const setEditPermission = useStore((state) => state.setEditPermission);
  const selectedFiles = props.files.filter((e) => e.selected);

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
            <FilePermission selectedFiles={selectedFiles} />
          </Stack>
          <AddPermission />
          <RemovePermission />
        </Stack>
      </Container>
    </div>
  );
}

function FilePermission(props) {
  const selectedFiles = props.selectedFiles;

  return (
    <Container>
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
                            {permission.permission}
                          </Dropdown.Toggle>

                          <Dropdown.Menu>
                            <Dropdown.Item>Editor</Dropdown.Item>
                            <Dropdown.Item>Reader</Dropdown.Item>
                            <Dropdown.Item>Viewer</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                      <td>{permission.access}</td>
                      <td>
                        <MdClose size={24} style={{ color: "#CFCFCF" }} />
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

function AddPermission() {
  return (
    <Container fluid className={"no-gutters"}>
      <Container style={{ border: "1px solid #CFCFCF", borderRadius: "10px" }}>
        <Row
          style={{
            borderBottom: "1px solid #CFCFCF",
            paddingLeft: "10px",
          }}
        >
          Add People and Groups
        </Row>
        <Stack direction="horizontal" gap={3} className="pt-3">
          <Form.Control style={{ background: "#E9ECEF" }} />
          <Button
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
              Editor
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item>Editor</Dropdown.Item>
              <Dropdown.Item>Reader</Dropdown.Item>
              <Dropdown.Item>Viewer</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Stack>
      </Container>
    </Container>
  );
}

function RemovePermission() {
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
          <Form.Control style={{ background: "#E9ECEF" }} />
          <Button
            style={{
              background: "#F06B6B",
              borderColor: "#CFCFCF",
              borderRadius: "10px",
              color: "white",
            }}
          >
            Remove
          </Button>
        </Stack>
      </Container>
    </Container>
  );
}
