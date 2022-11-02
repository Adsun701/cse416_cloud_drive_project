import React, { useState, useEffect } from "react";
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
  const [fileSnapshots, setFileSnapshots] = useState([]);
  const [groupSnapshots, setGroupSnapshots] = useState([]);
  const [selectAllFile, setSelectAllFile] = useState(false);
  const [selectAllGroup, setSelectAllGroup] = useState(false);
  let fileTimestamps = [];
  let groupInfo = [];
  if (location.state) {
    for (let i = 0; i < location.state.fileSnapshots.length; i++) {
      let snapshot = {
        id: i + 1,
        timestamp: new Date(location.state.fileSnapshots[i].createdAt),
        selected: false,
      };
      fileTimestamps.push(snapshot);
    }
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

  useEffect(() => {
    setFileSnapshots(fileTimestamps);
    setGroupSnapshots(groupInfo);
  }, []);

  let onSelectAllFileSnapshot = (e, item) => {
    let temp = [...fileTimestamps];
    temp.map((snapshot) => (snapshot.selected = e.target.checked));

    setSelectAllFile(e.target.checked);
    setFileSnapshots(temp);
  };

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

  let onSelectAllGroupSnapshot = (e, item) => {
    let temp = [...groupInfo];
    temp.map((snapshot) => (snapshot.selected = e.target.checked));

    setSelectAllGroup(e.target.checked);
    setGroupSnapshots(temp);
  };

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
              <Row>
                <Col style={{display:'flex', justifyContent:'left', padding: '15px'}}>
                  <Form.Select>
                    <option value="">Analyze Sharing</option>
                    <option value="deviant">Deviant Sharing</option>
                    <option value="folder">File-Folder Sharing Differences</option>
                    <option value="changes">Sharing Changes</option>
                  </Form.Select>
                </Col>
                <Col style={{display:'flex', justifyContent:'left', padding: '15px'}}>
                  <Button>
                    Analyze
                  </Button>
                </Col>
              </Row>
              <Row>
                <Col style={{display:'flex', justifyContent:'left', padding: '15px', fontSize: '20px'}}>
                  File Snapshots
                </Col>
                <Col style={{display:'flex', justifyContent:'left', padding: '15px', fontSize: '20px'}}>
                  Group Snapshots
                </Col>
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
              </Row>
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  );
}
