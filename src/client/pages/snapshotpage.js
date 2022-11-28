import React, { useState, useEffect, useContext } from "react";
import { Context } from "../Context";
import Header from '../components/header';
import Container from "react-bootstrap/Container";
import SideBar from "../components/sidebar";
import DataTable from "../components/datatable";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from 'react-bootstrap/Form';
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import { MdSearch, MdArrowRight, MdArrowDropDown } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import AxiosClient from "../AxiosClient";

export default function SnapshotPage() {
  const location = useLocation();
  const [context, setContext] = useContext(Context);

  const [fileSnapshots, setFileSnapshots] = useState([]);
  const [groupSnapshots, setGroupSnapshots] = useState([]);
  const [selectAllFile, setSelectAllFile] = useState(false);
  const [selectAllGroup, setSelectAllGroup] = useState(false);
  const [sharingOption, setSharingOption] = useState('redundant');
  const [analysisDone, setAnalysisDone] = useState(false);

  let fileTimestamps = [];
  let groupInfo = [];
  if (location.state) {
    // Get the file snapshots from the state and extract the information needed to be displayed in snapshot table
    for (let i = 0; i < location.state.fileSnapshots.length; i++) {
      //console.log(location.state.fileSnapshots[i]);
      let snapshot = {
        id: i + 1,
        files: location.state.fileSnapshots[i].files,
        timestamp: new Date(location.state.fileSnapshots[i].createdAt),
        selected: false,
      };
      fileTimestamps.push(snapshot);
    }

    // Get the group snapshots from the state and extract the information needed to be displayed in snapshot table
    if (context[0] === "google") {
      for (let i = 0; i < location.state.groupSnapshots.length; i++) {
        let info = {
          id: i + 1,
          groupName: location.state.groupSnapshots[i].groupName,
          groupMembers: location.state.groupSnapshots[i].groupMembers,
          createdAt: location.state.groupSnapshots[i].createdAt,
          selected: false,
          expanded: false,
        };
        groupInfo.push(info);
      }
    }
  }

  useEffect(() => {
    setFileSnapshots(fileTimestamps);
    setGroupSnapshots(groupInfo);
  }, []);

  // select all file snapshots
  let onSelectAllFileSnapshot = (e, item) => {
    let temp = [...fileTimestamps];
    temp.map((snapshot) => (snapshot.selected = e.target.checked));

    setSelectAllFile(e.target.checked);
    setFileSnapshots(temp);
  };

  // select a file snapshot
  let onSelectFileSnapshot = (e, item) => {
    let temp = [...fileSnapshots];
    if (selectAllFile) {
      setSelectAllFile(false);
    }
    temp.map((snapshot) => {
      if (snapshot.id === item.id) {
        snapshot.selected = e.target.checked;
      }
      return snapshot;
    });
    setFileSnapshots(temp);
  };

  // select all group snapshots
  let onSelectAllGroupSnapshot = (e, item) => {
    let temp = [...groupInfo];
    temp.map((snapshot) => (snapshot.selected = e.target.checked));

    setSelectAllGroup(e.target.checked);
    setGroupSnapshots(temp);
  };

  // select a group snapshot
  let onSelectGroupSnapshot = (e, item) => {
    let temp = [...groupSnapshots];
    if (selectAllGroup) {
      setSelectAllGroup(false);
    }
    temp.map((snapshot) => {
      if (snapshot.id === item.id) {
        snapshot.selected = e.target.checked;
      }
      return snapshot;
    });
    setGroupSnapshots(temp);
  };

  // expand group members list
  let onExpand = (e, item) => {
    let temp = [...groupSnapshots];
    temp.map((snapshot) => {
      if (snapshot.id === item.id) {
        snapshot.expanded = !snapshot.expanded;
      }
      return snapshot;
    });
    setGroupSnapshots(temp);
  };

  // handle select sharing option.
  let handleSelectSharingOption = (e) => {
    setSharingOption(e?.target?.value);
  };

  // handle set analysis done.
  let handleSelectAnalysisDone = () => {
    setAnalysisDone(true);
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
            {!analysisDone && <Col>
              <Row>
                <Col style={{display:'flex', justifyContent:'left', padding: '15px'}}>
                  <Form.Select aria-label="Analyze Sharing"
                    onChange={handleSelectSharingOption}>
                    <option value="redundant">Redundant Sharing</option>
                    <option value="deviant">Deviant Sharing</option>
                    <option value="folder">File-Folder Sharing Differences</option>
                    <option value="changes">Sharing Changes</option>
                  </Form.Select>
                </Col>
                <Col style={{display:'flex', justifyContent:'left', padding: '15px'}}>
                  <Button
                    onClick={handleSelectAnalysisDone}>
                    Analyze
                  </Button>
                </Col>
              </Row>
              <Row>
                <Col style={{display:'flex', justifyContent:'left', padding: '15px', fontSize: '20px'}}>
                  File Snapshots
                </Col>
                {context[0] === "google" ? 
                <Col style={{display:'flex', justifyContent:'left', padding: '15px', fontSize: '20px'}}>
                  Group Snapshots
                </Col>
                : <></>}
              </Row>
              <Row>
                <Col style={{justifyContent:'left'}}>
                  <Table style={{ textAlign: "left" }}>
                    <thead style={{ borderTop: "1px solid #CFCFCF" }}>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectAllFile}
                            id="selectAll"
                            onChange={(e) => onSelectAllFileSnapshot(e)}
                          />
                        </th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fileSnapshots.map((snapshot) => (
                        <tr key={snapshot.id} className={snapshot.selected ? "selected" : ""}>
                          <th scope="row">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={snapshot.selected}
                              id="rowcheck{snapshot.id}"
                              onChange={(e) => onSelectFileSnapshot(e, snapshot)}
                            />
                          </th>
                          <td>{snapshot.timestamp.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
                {context[0] === "google" ?
                <Col style={{justifyContent:'left'}}>
                  <Table style={{ textAlign: "left" }}>
                    <thead style={{ borderTop: "1px solid #CFCFCF" }}>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectAllGroup}
                            id="selectAllGroup"
                            onChange={(e) => onSelectAllGroupSnapshot(e)}
                          />
                        </th>
                        <th>Group Name</th>
                        <th colSpan={2}>Group Members</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupSnapshots.map((snapshot) => (
                        <tr key={snapshot.id} className={snapshot.selected ? "selected" : ""}>
                          <th scope="row">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={snapshot.selected}
                              id="rowcheck{snapshot.id}"
                              onChange={(e) => onSelectGroupSnapshot(e, snapshot)}
                            />
                          </th>
                          <td>{snapshot.groupName}</td>
                          {snapshot.expanded ? (
                            <>
                              <td style={{ paddingRight: "0px" }}>
                                <MdArrowDropDown
                                  size={24}
                                  style={{ color: "#CFCFCF" }}
                                  onClick={(e) => onExpand(e, snapshot)}
                                />
                              </td>
                              <td style={{ paddingLeft: "0px" }}>
                                {snapshot.groupMembers.map((member) => (
                                  <React.Fragment>
                                    {member}
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
                                  onClick={(e) => onExpand(e, snapshot)}
                                />
                              </td>
                              <td style={{ paddingLeft: "0px" }}>
                                {snapshot.groupMembers
                                  .slice(0, 2)
                                  .map((member) => (
                                    <React.Fragment>
                                      {member}
                                      <br />
                                    </React.Fragment>
                                  ))}
                              </td>
                            </>
                          )}
                          <td>{new Date(snapshot.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
              : <></>}
              </Row>
            </Col>}
            {analysisDone && sharingOption === 'redundant' && <Col>
              <Row>
                <Col style={{justifyContent:'left'}}>
                  <Table style={{ textAlign: "left" }}>
                    <thead style={{ borderTop: "1px solid #CFCFCF" }}>
                      <tr>
                        <th>File Name</th>
                        <th>Metadata</th>
                        <th colSpan={2}>Redundant Permissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fileSnapshots.map((snapshot) => (
                        snapshot?.files[Object.keys(snapshot?.files)[0]]?.map((file) => (
                          <tr key={file.id} className={"file-snapshot"}>
                          <td>{file.displayName}</td>
                          <td>{file.email}</td>
                          <td colSpan={2}>{file.roles.join(", ")}</td>
                        </tr>
                        ))
                      ))}
                      {groupSnapshots.map((snapshot) => (
                          <tr key={snapshot.id} className={"group-snapshot"}>
                          <td>{snapshot.groupName}</td>
                          <td>{snapshot.createdAt}</td>
                          <td colSpan={2}>{snapshot.groupMembers.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Col>}
            {analysisDone && sharingOption === 'deviant' && <Col>
              <Row>
                <Col style={{justifyContent:'left'}}>
                  <Table style={{ textAlign: "left" }}>
                    <thead style={{ borderTop: "1px solid #CFCFCF" }}>
                      <tr>
                        <th>File Name</th>
                        <th>Metadata</th>
                        <th colSpan={2}>Deviant Permissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fileSnapshots.map((snapshot) => (
                        snapshot?.files[Object.keys(snapshot?.files)[0]]?.map((file) => (
                          <tr key={file.id} className={"file-snapshot"}>
                          <td>{file.displayName}</td>
                          <td>{file.email}</td>
                          <td colSpan={2}>{file.roles.join(", ")}</td>
                        </tr>
                        ))
                      ))}
                      {groupSnapshots.map((snapshot) => (
                          <tr key={snapshot.id} className={"group-snapshot"}>
                          <td>{snapshot.groupName}</td>
                          <td>{snapshot.createdAt}</td>
                          <td colSpan={2}>{snapshot.groupMembers.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Col>}
            {analysisDone && sharingOption === 'folder' && <Col>
              <Row>
                <Col style={{justifyContent:'left'}}>
                  <Table style={{ textAlign: "left" }}>
                    <thead style={{ borderTop: "1px solid #CFCFCF" }}>
                      <tr>
                        <th>File Name</th>
                        <th>Metadata</th>
                        <th colSpan={2}>Permission Differences</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fileSnapshots.map((snapshot) => (
                        snapshot?.files[Object.keys(snapshot?.files)[0]]?.map((file) => (
                          <tr key={file.id} className={"file-snapshot"}>
                          <td>{file.displayName}</td>
                          <td>{file.email}</td>
                          <td colSpan={2}>{file.roles.join(", ")}</td>
                        </tr>
                        ))
                      ))}
                      {groupSnapshots.map((snapshot) => (
                          <tr key={snapshot.id} className={"group-snapshot"}>
                          <td>{snapshot.groupName}</td>
                          <td>{snapshot.createdAt}</td>
                          <td colSpan={2}>{snapshot.groupMembers.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Col>}
            {analysisDone && sharingOption === 'changes' && <Col>
              <Row>
                <Col style={{justifyContent:'left'}}>
                  <Table style={{ textAlign: "left" }}>
                    <thead style={{ borderTop: "1px solid #CFCFCF" }}>
                      <tr>
                        <th>File Name</th>
                        <th>Metadata</th>
                        <th colSpan={2}>Sharing Changes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fileSnapshots.map((snapshot) => (
                        snapshot?.files[Object.keys(snapshot?.files)[0]]?.map((file) => (
                          <tr key={file.id} className={"file-snapshot"}>
                          <td>{file.displayName}</td>
                          <td>{file.email}</td>
                          <td colSpan={2}>{file.roles.join(", ")}</td>
                        </tr>
                        ))
                      ))}
                      {groupSnapshots.map((snapshot) => (
                          <tr key={snapshot.id} className={"group-snapshot"}>
                          <td>{snapshot.groupName}</td>
                          <td>{snapshot.createdAt}</td>
                          <td colSpan={2}>{snapshot.groupMembers.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Col>}
          </Row>
        </div>
      </Container>
    </div>
  );
}
