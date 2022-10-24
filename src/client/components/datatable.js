import React from "react";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Table from "react-bootstrap/Table";
import { MdSearch } from "react-icons/md";
import "bootstrap/dist/css/bootstrap.min.css";
import "../app.css";

export default function DataTable() {
  function callAPI() {
    // TODO: try to pass googleToken into this to actually receive data
    fetch("http://localhost:8080/google/last15modifiedfiles" + new URLSearchParams({
    }))
      .then(res => res.text())
      .then(text => console.log(text));
  };

  let data = [];
  callAPI();
  for (let i = 0; i < 15; i++) {
    data.push(
      <tr>
        <td>
          <input
            type="checkbox"
            // checked={user.selected}
            // className="form-check-input"
            // id="rowcheck{user.id}"
            // onChange={(e) => this.onItemCheck(e, user)}
          />
        </td>
        <td>Folder {i + 1}</td>
        <td>Owner</td>
        <td>Type</td>
        <td>Last modified</td>
        <td>Created</td>
        <td>
          (name of person/group, current permission, inherited/direct) <br/>
          (name_of_person, edit, assigned)
        </td>
      </tr>
    );
  }

  return (
    <div style={{ padding: "20px"}}>
      <Container fluid className={"no-gutters mx-0 px-0"}>
        <Row>
          <Col style={{ textAlign: "left" }}>
            <InputGroup className="mb-3">
              <Form.Control
                placeholder="Search files"
                aria-label="Search files"
                aria-describedby="basic-addon2"
              />
              <InputGroup.Text id="basic-addon2">
                <MdSearch />
              </InputGroup.Text>
            </InputGroup>
          </Col>
          <Col style={{ textAlign: "right" }}>
            <Button
              style={{
                background: "#3484FD",
                borderColor: "#CFCFCF",
                borderRadius: "30px",
                color: "white",
              }}
            >
              Edit Permission
            </Button>
          </Col>
        </Row>
        <Row style={{ overflow: "auto" }}>
          <Table style={{ textAlign: "left" }}>
            <thead style={{ borderTop: "1px solid #CFCFCF"}}>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    // checked={user.selected}
                    // className="form-check-input"
                    // id="rowcheck{user.id}"
                    // onChange={(e) => this.onItemCheck(e, user)}
                  />
                </th>
                <th>Name</th>
                <th>Owner</th>
                <th>Type</th>
                <th>Last modified</th>
                <th>Created</th>
                <th>Permissions</th>
              </tr>
            </thead>
            <tbody>
              {/* <tr>
                <td>
                  <input
                    type="checkbox"
                    // checked={user.selected}
                    // className="form-check-input"
                    // id="rowcheck{user.id}"
                    // onChange={(e) => this.onItemCheck(e, user)}
                  />
                </td>
                <td>Folder 1</td>
                <td>Owner</td>
                <td>Type</td>
                <td>Last modified</td>
                <td>Created</td>
                <td>
                  (name of person/group, current permission, inherited/direct)
                  (name_of_person, edit, assigned)
                </td>
              </tr> */}
              {data}
            </tbody>
          </Table>
        </Row>
      </Container>
    </div>
  );
}
