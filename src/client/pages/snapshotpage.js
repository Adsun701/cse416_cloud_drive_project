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
import { useNavigate, useLocation } from "react-router-dom";
import AxiosClient from "../AxiosClient";

export default function SnapshotPage() {
  const location = useLocation();
  const [fileSnapshots, setFileSnapshots] = useState([]);
  const [groupSnapshots, setGroupSnapshots] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  let fileTimestamps = [];
  let groupInfo = [];
  if (location.state) {
    for (let i = 0; i < location.state.fileSnapshots.length; i++) {
      fileTimestamps.push(new Date(location.state.fileSnapshots[i].createdAt));
    }
    for (let i = 0; i < location.state.groupSnapshots.length; i++) {
      let info = {
        groupName: location.state.groupSnapshots[i].groupName,
        groupMembers: location.state.groupSnapshots[i].groupMembers,
      };
      groupInfo.push(info);
    }
  }

  useEffect(() => {
    setFileSnapshots(fileTimestamps);
    setGroupSnapshots(groupInfo);
  }, []);

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
                            checked={selectAll}
                            id="selectAll"
                            onChange={(e) => onSelectAll(e)}
                          />
                        </th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fileSnapshots.map((snapshot) => (
                        <tr>
                          <th scope="row">
                            <input
                              type="checkbox"
                              className="form-check-input"
                            />
                          </th>
                          <td>{snapshot.toString()}</td>
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
                            checked={selectAll}
                            id="selectAll"
                            onChange={(e) => onSelectAll(e)}
                          />
                        </th>
                        <th>Group Name</th>
                        <th>Group Members</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupSnapshots.map((snapshot) => (
                        <tr>
                          <th scope="row">
                            <input
                              type="checkbox"
                              className="form-check-input"
                            />
                          </th>
                          <td>{snapshot.groupName}</td>
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
