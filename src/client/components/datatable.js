import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import ListGroup from "react-bootstrap/ListGroup";
import Button from "react-bootstrap/Button";
import CloseButton from 'react-bootstrap/CloseButton';
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Table from "react-bootstrap/Table";
import { MdSearch, MdArrowRight, MdArrowDropDown, MdArrowDropUp } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../app.css";
import { useStore } from "../store";
import AxiosClient from "../AxiosClient";

export default function DataTable(props) {
  const navigate = useNavigate();

  const files = props.files;
  const setFiles = props.setFiles;
  const fileSnapshots = props.fileSnapshots;
  const setFileSnapshots = props.setFileSnapshots;
  const [selectSnapshot, setSelectSnapshot] = useState("1");
  const [snapshotCreatedAt, setSnapshotCreatedAt] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [cursorOverSearchButton, setCursorOverSearchButton] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [recentQueriesVisible, setRecentQueriesVisible] = useState(false);

  const [sortNameButton, setSortNameButton] = useState(false);
  const [sortOwnerButton, setSortOwnerButton] = useState(false);
  const [sortModifiedButton, setSortModifiedButton] = useState(false);
  const [sortCreatedButton, setSortCreatedButton] = useState(false);

  const setEditPermission = useStore((state) => state.setEditPermission);

  const [recentQueries, setRecentQueries] = useState([]);

  const [builder, setBuilder] = useState(false);
  const [drive, setDrive] = useState("");
  const [owner, setOwner] = useState("");
  const [creator, setCreator] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [readable, setReadable] = useState("");
  const [writable, setWritable] = useState("");
  const [shareable, setShareable] = useState("");
  const [name, setName] = useState("");
  const [inFolder, setInFolder] = useState("");
  const [folder, setFolder] = useState("");
  const [path, setPath] = useState("");
  const [sharing, setSharing] = useState("");

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
    AxiosClient.post('/searchquery', {
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
              permission: object.permissions[j].roles[0],
              access: object.permissions[j].inheritedFrom == null ? "Direct" : "Inherited"
            };
            permissionsArray.push(entry);
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

  let handleSelectSnapshot = (event) => {
    setSelectSnapshot(event.target.value);
    let selected = fileSnapshots[event.target.value - 1];
    setSnapshotCreatedAt(selected.createdAt);
  }

  let handleQueryBuilder = (event) => {
    setBuilder(true);
  }

  let handleCloseBuilder = (event) => {
    setBuilder(false);
  }

  let handleResetBuilder = (event) => {
    setDrive("");
    setOwner("");
    setCreator("");
    setFrom("");
    setTo("");
    setReadable("");
    setWritable("");
    setShareable("");
    setName("");
    setInFolder("");
    setFolder("");
    setPath("");
    setSharing("");
  }

  let handleSharingOption = (event) => {
    setSharing(event.target.value);
  }

  let handleBuilderSearch = (event) => {
    let query = "";
    let drives = drive === "" ? [] : drive.split(',').map(e => e.trim());
    let owners = owner === "" ? [] : owner.split(',').map(e => e.trim());
    let creators = creator === "" ? [] : creator.split(',').map(e => e.trim());
    let froms = from === "" ? [] : from.split(',').map(e => e.trim());
    let tos = to === "" ? [] : to.split(',').map(e => e.trim());
    let reads = readable === "" ? [] : readable.split(',').map(e => e.trim());
    let writes = writable === "" ? [] : writable.split(',').map(e => e.trim());
    let shares = shareable === "" ? [] : shareable.split(',').map(e => e.trim());
    let names = name === "" ? [] : name.split(',').map(e => e.trim());
    let inFolders = inFolder === "" ? [] : inFolder.split(',').map(e => e.trim());
    let folders = folder === "" ? [] : folder.split(',').map(e => e.trim());
    let paths = path === "" ? [] : path.split(',').map(e => e.trim());
    drives.forEach(element => {query += "drive:"+element+" "});
    owners.forEach(element => {query += "owner:"+element+" "});
    creators.forEach(element => {query += "creator:"+element+" "});
    froms.forEach(element => {query += "from:"+element +" "});
    tos.forEach(element => {query += "to:"+element+" "});
    reads.forEach(element => {query += "readable:"+element+" "});
    writes.forEach(element => {query += "writable:"+element+" "});
    shares.forEach(element => {query += "shareable:"+element+" "});
    names.forEach(element => {query += "name:"+element+" "});
    inFolders.forEach(element => {query += "inFolder:"+element+" "});
    folders.forEach(element => {query += "folder:"+element+" "});
    paths.forEach(element => {query += "path:"+element+" "});
    query += "sharing:"+sharing;
    query = query.replace(" ", " and ");
    setSearchText(query);
    setBuilder(false);
    console.log(snapshotCreatedAt);
    handleResetBuilder();
  }

  let sortName = (event) => {
    let temp = files;
    if (!sortNameButton) {
      temp.sort((a,b) => (a.name < b.name) ? 1 : ((b.name < a.name) ? -1 : 0));
    } else {
      temp.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
    }
    setSortNameButton(!sortNameButton);
    setFiles(temp);
  }

  let sortOwner= (event) => {
    let temp = files;
    if (!sortOwnerButton) {
      temp.sort((a,b) => (a.owner < b.owner) ? 1 : ((b.owner < a.owner) ? -1 : 0));
    } else {
      temp.sort((a,b) => (a.owner > b.owner) ? 1 : ((b.owner > a.owner) ? -1 : 0));
    }
    setSortOwnerButton(!sortOwnerButton);
    setFiles(temp);
  }

  let sortModified= (event) => {
    let temp = files;
    if (!sortModifiedButton) {
      temp.sort((a,b) => (a.lastModified < b.lastModified) ? 1 : ((b.lastModified < a.lastModified) ? -1 : 0));
    } else {
      temp.sort((a,b) => (a.lastModified > b.lastModified) ? 1 : ((b.lastModified > a.lastModified) ? -1 : 0));
    }
    setSortModifiedButton(!sortModifiedButton);
    setFiles(temp);
  }

  let sortCreated= (event) => {
    let temp = files;
    if (!sortCreatedButton) {
      temp.sort((a,b) => (a.created < b.created) ? 1 : ((b.created < a.created) ? -1 : 0));
    } else {
      temp.sort((a,b) => (a.created > b.created) ? 1 : ((b.created > a.created) ? -1 : 0));
    }
    setSortCreatedButton(!sortCreatedButton);
    setFiles(temp);
  }

  return (
    <div style={{ padding: "20px" }}>
      <Container fluid className={"no-gutters mx-0 px-0"}>
        <Row>
          <Col className="mb-3" style={{ textAlign: "left", width: "40em" }}
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
                onClick={builder ? handleBuilderSearch : () => handleSearch(searchText)} 
                onMouseOver={handleCursorOverSearchButton} 
                onMouseLeave={handleCursorLeaveSearchButton}>
                <MdSearch/>
              </InputGroup.Text>
            </InputGroup>
            { builder ?
              <Container id="query-builder">
                <Row style={{display:'flex', justifyContent:'right', padding: '15px'}}>
                  <Col style={{fontSize: '20px'}}>
                    Query Builder
                  </Col>
                  <Col md="auto">
                    <CloseButton onClick={handleCloseBuilder}/>
                  </Col>
                </Row>
                <Form>
                  <Row className="mb-3">
                    <Form.Group as={Col} controlId="drive">
                      <Form.Label>Drive</Form.Label>
                      <Form.Control placeholder="Drive Name" value={drive} onChange={(event) => setDrive(event.target.value)}/>
                    </Form.Group>
                    <Form.Group as={Col} controlId="owner">
                      <Form.Label>Owner</Form.Label>
                      <Form.Control placeholder="User" value={owner} onChange={(event) => setOwner(event.target.value)}/>
                    </Form.Group>
                    <Form.Group as={Col} controlId="creator">
                      <Form.Label>Creator</Form.Label>
                      <Form.Control placeholder="User" value={creator} onChange={(event) => setCreator(event.target.value)}/>
                    </Form.Group>
                  </Row>
                  <Row className="mb-3">
                    <Form.Group as={Col} controlId="from">
                      <Form.Label>From</Form.Label>
                      <Form.Control placeholder="User" value={from} onChange={(event) => setFrom(event.target.value)}/>
                    </Form.Group>
                    <Form.Group as={Col} controlId="to">
                      <Form.Label>To</Form.Label>
                      <Form.Control placeholder="User" value={to} onChange={(event) => setTo(event.target.value)}/>
                    </Form.Group>
                  </Row>
                  <Row className="mb-3">
                    <Form.Group as={Col} controlId="readable">
                      <Form.Label>Readable</Form.Label>
                      <Form.Control placeholder="User" value={readable} onChange={(event) => setReadable(event.target.value)}/>
                    </Form.Group>
                    <Form.Group as={Col} controlId="writable">
                      <Form.Label>Writable</Form.Label>
                      <Form.Control placeholder="User" value={writable} onChange={(event) => setWritable(event.target.value)}/>
                    </Form.Group>
                    <Form.Group as={Col} controlId="shareable">
                      <Form.Label>Shareable</Form.Label>
                      <Form.Control placeholder="User" value={shareable} onChange={(event) => setShareable(event.target.value)}/>
                    </Form.Group>
                  </Row>
                  <Row className="mb-3">
                    <Form.Group as={Col} controlId="name">
                      <Form.Label>File Name</Form.Label>
                      <Form.Control placeholder="Name" value={name} onChange={(event) => setName(event.target.value)}/>
                    </Form.Group>
                    <Form.Group as={Col} controlId="inFolder">
                      <Form.Label>In Folder</Form.Label>
                      <Form.Control placeholder="Folder Name" value={inFolder} onChange={(event) => setInFolder(event.target.value)}/>
                    </Form.Group>
                    <Form.Group as={Col} controlId="folder">
                      <Form.Label>Folder</Form.Label>
                      <Form.Control placeholder="Folder Name" value={folder} onChange={(event) => setFolder(event.target.value)}/>
                    </Form.Group>
                  </Row>
                  <Form.Group className="mb-3" controlId="path">
                    <Form.Label>Path</Form.Label>
                    <Form.Control placeholder="Path (separated by /)" value={path} onChange={(event) => setPath(event.target.value)}/>
                  </Form.Group>
                  <Form.Group className="mb-3"  controlId="sharing">
                      <Form.Label>Sharing</Form.Label>
                      <Form.Select value={sharing} onChange={handleSharingOption}>
                        <option value="">Choose...</option>
                        <option value="none">none</option>
                        <option value="anyone">anyone</option>
                        <option value="individual">individual</option>
                        <option value="domain">domain</option>
                      </Form.Select>
                  </Form.Group>
                  <Row style={{display:'flex', justifyContent:'right', padding: '15px'}}>
                    <Col md="auto">
                      <button type="button" className="btn bg-transparent" onClick={handleResetBuilder}>Reset</button>
                    </Col>
                    <Col md="auto">
                      <Button variant="primary" onClick={handleBuilderSearch}>
                        Search
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Container>
              :
              <ListGroup id="recent-query" hidden={recentQueriesVisible ? false : true}>
                {recentQueries.length > 0 && recentQueries.map((query) => (
                  <ListGroup.Item as="button" style={{textAlign: "left", color: "gray"}}
                  onClick={() => handleClickQuery(query)}>{query}</ListGroup.Item>
                ))}
                <ListGroup.Item as="button" style={{textAlign: "right", textDecoration: "underline"}} onClick={handleQueryBuilder}>Query Builder</ListGroup.Item>
              </ListGroup>
            }
          </Col>
          <Col>
            <Form.Select value={selectSnapshot} onChange={handleSelectSnapshot}>
              {fileSnapshots.map((snapshot) => (
                <option key={snapshot.id} value={snapshot.id}>
                  {snapshot.timestamp.toString()}
                </option>
              ))}
            </Form.Select>
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
                <><th>Name {sortNameButton ? <MdArrowDropUp onClick={sortName}/> : <MdArrowDropDown onClick={sortName}/>}</th></>
                <><th>Owner {sortOwnerButton ? <MdArrowDropUp onClick={sortOwner}/> : <MdArrowDropDown onClick={sortOwner}/>}</th></>
                <th>Type</th>
                <><th>Last Modified {sortModifiedButton ? <MdArrowDropUp onClick={sortModified}/> : <MdArrowDropDown onClick={sortModified}/>}</th></>
                <><th>Created {sortCreatedButton ? <MdArrowDropUp onClick={sortCreated}/> : <MdArrowDropDown onClick={sortCreated}/>}</th></>
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
