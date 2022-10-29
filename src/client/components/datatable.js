import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import ListGroup from "react-bootstrap/ListGroup";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Table from "react-bootstrap/Table";
import { MdSearch, MdArrowRight, MdArrowDropDown } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../app.css";
import { useStore } from "../store";
import AxiosClient from "../AxiosClient";

export default function DataTable(props) {
  const navigate = useNavigate();

  const files = props.files;
  const setFiles = props.setFiles;
  const [selectAll, setSelectAll] = useState(false);
  const [cursorOverSearchButton, setCursorOverSearchButton] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [recentQueriesVisible, setRecentQueriesVisible] = useState(false);

  const setEditPermission = useStore((state) => state.setEditPermission);

  const [recentQueries, setRecentQueries] = useState([]);

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

  let handleTextChange = () => {
    if (event && event.target && event.target.value != null) setSearchText(event.target.value);
  }

  let handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch(searchText);
  }

  let handleSearch = (s) => {
    s = s?.trim();
    // update recentQueries
    let newRecentQueries = [];
    newRecentQueries.push(s);
    for (let i = 0; i < recentQueries.length; i++) {
      if (recentQueries[i] != s) newRecentQueries.push(recentQueries[i]);
    }
    setRecentQueries(newRecentQueries);

    // post to route
    AxiosClient.post('/google/searchquery', {
      query: s
    }).then((res) => {
      // get data
      let data = res.data;

      // if data is null or data length is 0 simply set files to empty list
      if (data == null || data.length == 0) {
        setFiles([]);
        return;
      }

      // initialize variables
      let newFiles = [];
      let file = null;
      let object = null;

      // iterate through each file to add to list
      for (let i = 0; i < data.length; i++) {
        object = data[i];
        let permissionsArray = [];

        // get owner names
        let ownerDisplayNames = [];
        if (object.owners) {
          for (let j = 0; j < object.owners.length; j++) {
            ownerDisplayNames.push(object.owners[j].displayName);
          }
        }

        // get permission data
        if (object.permissions) {
          for (let j = 0; j < object.permissions.length; j++) {
            let entry = {
              id: j + 1,
              name: object.permissions[j].displayName,
              permission: object.permissions[j].role,
              access: object.permissions[j].type
            };
            permissionsArray.push(entry);
            j++;
          }
        }

        // initialize and push file to array.
        file = {
          id: i + 1,
          selected: false,
          expanded: false,
          name: object.name,
          owner: ownerDisplayNames.join(",\n"),
          type: object.mimeType,
          lastModified: (new Date(object.modifiedTime)).toLocaleString(),
          created: (new Date(object.createdTime)).toLocaleString(),
          permissions: permissionsArray
        };
        newFiles.push(file);
      }

      // set new files.
      setFiles(newFiles);
    });
  }

  let handleCursorOverSearchButton = () => {
    setCursorOverSearchButton(true);
  }

  let handleCursorLeaveSearchButton = () => {
    setCursorOverSearchButton(false);
  }

  let handleClickQuery = (query) => {
    handleSearch(query);
  }

  return (
    <div style={{ padding: "20px" }}>
      <Container fluid className={"no-gutters mx-0 px-0"}>
        <Row>
          <Col className="mb-3" style={{ textAlign: "left", width: "30em" }}
            onMouseLeave={() => setRecentQueriesVisible(false)}>
            <InputGroup id="search-file">
              <Form.Control
                placeholder="Search files"
                aria-label="Search files"
                aria-describedby="basic-addon2"
                value={searchText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onClick={() => setRecentQueriesVisible(true)}
                type="text"
              />
              <InputGroup.Text id="basic-addon2"
                style={{
                  backgroundColor: cursorOverSearchButton ? 'salmon' : '',
                  color: cursorOverSearchButton ? 'white' : '',
                }}
                onClick={() => handleSearch(searchText)} onMouseOver={handleCursorOverSearchButton} onMouseLeave={handleCursorLeaveSearchButton}>
                <MdSearch/>
              </InputGroup.Text>
            </InputGroup>
            <ListGroup id="recent-query" hidden={recentQueriesVisible ? false : true}>
              {recentQueries.length > 0 && recentQueries.map((query) => (
                <ListGroup.Item as="button" style={{textAlign: "left", color: "gray"}}
                onClick={() => handleClickQuery(query)}>{query}</ListGroup.Item>
              ))}
              <ListGroup.Item as="button" style={{textAlign: "right", textDecoration: "underline"}}>Query Builder</ListGroup.Item>
            </ListGroup>
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
