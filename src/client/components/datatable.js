import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Table from "react-bootstrap/Table";
import { MdSearch, MdArrowRight, MdArrowDropDown } from "react-icons/md";
import "bootstrap/dist/css/bootstrap.min.css";
import "../app.css";
import { useStore } from "../store";

export default function DataTable(props) {
  // function callAPI() {
  //   // TODO: try to pass googleToken into this to actually receive data
  //   fetch("http://localhost:8080/google/last15modifiedfiles" + new URLSearchParams({
  //   }))
  //     .then(res => res.text())
  //     .then(text => console.log(text));
  // };

  // callAPI();

  const files = props.files;
  const setFiles = props.setFiles;
  const [selectAll, setSelectAll] = useState(false);

  const setEditPermission = useStore((state) => state.setEditPermission);

  // select all files
  let onSelectAll = (e) => {
    let tempFiles = [...files];
    tempFiles.map((file) => (file.selected = e.target.checked));

    setSelectAll(e.target.checked);
    setFiles(tempFiles);
  };

  // update selected file
  let onSelectFile = (e, item) => {
    let tempFiles = [...files];
    tempFiles.map((file) => {
      if (file.id === item.id) {
        file.selected = e.target.checked;
      }
      return file;
    });

    const totalFiles = files.length;
    const totalSelectedFiles = tempFiles.filter((e) => e.selected).length;

    setSelectAll(totalFiles === totalSelectedFiles);
    setFiles(tempFiles);
  };

  // expand permissions
  let onExpand = (e, item) => {
    let tempFiles = [...files];
    tempFiles.map((file) => {
      if (file.id === item.id) {
        file.expanded = !file.expanded;
      }
      return file;
    });

    const totalFiles = files.length;
    const totalSelectedFiles = tempFiles.filter((e) => e.selected).length;

    setSelectAll(totalFiles === totalSelectedFiles);
    setFiles(tempFiles);
  };

  return (
    <div style={{ padding: "20px" }}>
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
            {files.filter((e) => e.selected).length > 0 && (
              <Button
                style={{
                  background: "#3484FD",
                  borderColor: "#CFCFCF",
                  borderRadius: "30px",
                  color: "white",
                }}
                onClick={setEditPermission}
              >
                Edit Permission
              </Button>
            )}
          </Col>
        </Row>
        <Row style={{ overflow: "auto" }}>
          <Table style={{ textAlign: "left" }}>
            <thead style={{ borderTop: "1px solid #CFCFCF" }}>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectAll}
                    id="selectAll"
                    onChange={(e) => onSelectAll(e)}
                  />
                </th>
                <th>Name</th>
                <th>Owner</th>
                <th>Type</th>
                <th>Last modified</th>
                <th>Created</th>
                <th colSpan={2}>Permissions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id} className={file.selected ? "selected" : ""}>
                  <th scope="row">
                    <input
                      type="checkbox"
                      checked={file.selected}
                      className="form-check-input"
                      id="rowcheck{file.id}"
                      onChange={(e) => onSelectFile(e, file)}
                    />
                  </th>
                  <td>{file.name}</td>
                  <td>{file.owner}</td>
                  <td>{file.type}</td>
                  <td>{file.lastModified}</td>
                  <td>{file.created}</td>
                  {file.expanded ? (
                    <>
                      <td style={{ paddingRight: "0px" }}>
                        <MdArrowDropDown
                          size={24}
                          style={{ color: "#CFCFCF" }}
                          onClick={(e) => onExpand(e, file)}
                        />
                      </td>
                      <td style={{ paddingLeft: "0px" }}>
                        {file.permissions.map((permission, index) => (
                          <React.Fragment key={index}>
                            {permission.name +
                              ", " +
                              permission.permission +
                              ", " +
                              permission.access}
                            <br />
                          </React.Fragment>
                        ))}
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ paddingRight: "0px" }}>
                        <MdArrowRight
                          size={24}
                          style={{ color: "#CFCFCF" }}
                          onClick={(e) => onExpand(e, file)}
                        />
                      </td>
                      <td style={{ paddingLeft: "0px" }}>
                        {file.permissions
                          .slice(0, 2)
                          .map((permission, index) => (
                            <React.Fragment key={index}>
                              {permission.name +
                                ", " +
                                permission.permission +
                                ", " +
                                permission.access}
                              <br />
                            </React.Fragment>
                          ))}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </Row>
      </Container>
    </div>
  );
}
