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

export default function DataTable() {
  // function callAPI() {
  //   // TODO: try to pass googleToken into this to actually receive data
  //   fetch("http://localhost:8080/google/last15modifiedfiles" + new URLSearchParams({
  //   }))
  //     .then(res => res.text())
  //     .then(text => console.log(text));
  // };

  // callAPI();
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
        "(name_of_person, edit, assigned)"
      ],
    }
  ];

  const [files, setFiles] = useState(fileData);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // select all files
  let onSelectAll = (e) => {
    let tempFiles = files;
    tempFiles.map((file) => (file.selected = e.target.checked));

    setSelectAll(e.target.checked);
    setFiles(tempFiles);
    setSelectedFiles(files.filter((e) => e.selected));
  };

  // update selected file
  let onSelectFile = (e, item) => {
    let tempFiles = files;
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
    setSelectedFiles(files.filter((e) => e.selected));
  };

  // expand permissions
  let onExpand = (e, item) => {
    let tempFiles = files;
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
    setSelectedFiles(files.filter((e) => e.selected));
  };

  let getSelectedFiles = () => {
    setSelectedFiles(files.filter((e) => e.selected));
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
                        <MdArrowDropDown onClick={(e) => onExpand(e, file)} />
                      </td>
                      <td style={{ paddingLeft: "0px" }}>
                        {file.permissions.map((permission, index) => (
                          <React.Fragment key={index}>
                            {permission}
                            <br />
                          </React.Fragment>
                        ))}
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ paddingRight: "0px" }}>
                        <MdArrowRight onClick={(e) => onExpand(e, file)} />
                      </td>
                      <td style={{ paddingLeft: "0px" }}>
                        {file.permissions
                          .slice(0, 2)
                          .map((permission, index) => (
                            <React.Fragment key={index}>
                              {permission}
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
