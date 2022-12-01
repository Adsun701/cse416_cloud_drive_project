import React, { useState, useEffect, useContext } from "react";
import { Context } from "../Context";
import Header from '../components/header';
import Container from "react-bootstrap/Container";
import SideBar from "../components/sidebar";
import DataTable from "../components/datatable";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from 'react-bootstrap/Form';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Alert from 'react-bootstrap/Alert';
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import { MdSearch, MdArrowRight, MdArrowDropDown, MdArrowDropUp } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import AxiosClient from "../AxiosClient";

export default function SnapshotPage() {
  const location = useLocation();
  const [context, setContext] = useContext(Context);

  const [fileSnapshots, setFileSnapshots] = useState([]);
  const [groupSnapshots, setGroupSnapshots] = useState([]);
  const [selectSnapshot, setSelectSnapshot] = useState("1");
  const [snapshotCreatedAt, setSnapshotCreatedAt] = useState("");
  const [selectAllFile, setSelectAllFile] = useState(false);
  const [selectAllGroup, setSelectAllGroup] = useState(false);
  const [sharingOption, setSharingOption] = useState("");
  const [twoSnapshots, setTwoSnapshots] = useState({});
  const [analysis, setAnalysis] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [changes, setChanges] = useState([]);
  const [folderFileDiff, setFolderFileDiff] = useState([]);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [threshold, setThreshold] = useState(75);
  const [deviantList, setDeviantList] = useState([]);

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
        selected: i === 0,//false,
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
  
  let handleSelectSnapshot = (event) => {
    setSelectSnapshot(event.target.value);
    let selected = fileSnapshots[event.target.value - 1];
    setSnapshotCreatedAt(selected.createdAt);
    let temp = [...fileSnapshots];
    temp.map((snapshot) => {
      if (snapshot.id === selected.id) {
        snapshot.selected = true;
      } else {
        snapshot.selected = false;
      }
      return snapshot;
    });
    setFileSnapshots(temp);
  }

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

  let onExpandPerm = (e, item) => {
    let temp = [...newFiles];
    temp.map((file) => {
      if (file.id === item.id) {
        file.expanded = !file.expanded;
      }
      return file;
    });
    setNewFiles(temp);
  };

  let onExpandFilePerm = (e, item) => {
    let temp = [...folderFileDiff];
    temp.map((diff) => {
      if (diff.file.id === item.id) {
        diff.filePermExpanded = !diff.filePermExpanded;
      }
      return diff;
    });
    setFolderFileDiff(temp);
  };

  let onExpandFolderPerm = (e, item) => {
    let temp = [...folderFileDiff];
    temp.map((diff) => {
      if (diff.file.id === item.id) {
        diff.folderPermExpanded = !diff.folderPermExpanded;
      }
      return diff;
    });
    setFolderFileDiff(temp);
  };

  // handle select sharing option.
  let handleSelectSharingOption = (e) => {
    setSharingOption(e?.target?.value);
  };

  // handle set analysis done.
  let handleSelectAnalysisDone = () => {
    const temp = fileSnapshots.filter((s) => s.selected); 
    const routes = {"deviant": '/deviant', "folder": '/folderfile', "changes": '/sharingchanges'};
    let body = {};
    if (sharingOption === "changes") {
      const temp = fileSnapshots.filter((s) => s.selected);
      const earlier = temp[0].timestamp < temp[1].timestamp;
      body = {
        snapshot1: earlier ? temp[0].timestamp : temp[1].timestamp,
        snapshot2: earlier ? temp[1].timestamp : temp[0].timestamp,
      }
      setTwoSnapshots(body);
    } else {
      body = {
        snapshot: temp[0].timestamp,
      }
    }
    if (sharingOption === "deviant") {
      const snapshot = fileSnapshots.filter((s) => s.selected);
      if (snapshot.length > 1) {
        console.log("too many snapshots");
        return;
      } else if (snapshot.length == 1) {
        body = {
          snapshot: snapshot[0].timestamp,
          useRecentSnapshot: false,
          threshold: threshold,
        }
      } else {
        body = {
          snapshot: null,
          useRecentSnapshot: true,
          threshold: threshold,
        }
      }
    }
    AxiosClient.post(routes[sharingOption], body).then((res) => {
      // console.log(res);
      const data = res.data;
      // console.log("differences");
      // console.log(data);
      if (data == null || data.length == 0) {
        setAnalysis([]);
        return;
      }
      let newF = [];
      let diff = [];
      let i = 0;
      let newFiles = data.newFiles !== undefined ? data.newFiles : [];
      let differences = data.differences !== undefined ? data.differences : [];
      let deviants = data !== undefined ? Object.entries(data) : [];
      console.log("deviants");
      console.log(deviants);
      let folderFileDiff = data.folderFileDiff !== undefined ? data.folderFileDiff : [];
      let newD = [];

      for (const diff of folderFileDiff) {
        const onlyInFolder = [];
        if (diff.onlyInFolder) {
          for (let j = 0; j < diff.onlyInFolder.length; j++) {
            let entry = {
              id: j + 1,
              name: diff.onlyInFolder[j].displayName,
              email: diff.onlyInFolder[j].email,
              permission: diff.onlyInFolder[j].roles[0],
              access: diff.onlyInFolder[j].inheritedFrom == null ? "Direct" : "Inherited"
            };
            onlyInFolder.push(entry);
          }
        }
        const onlyInFile = [];
        if (diff.onlyInFile) {
          for (let j = 0; j < diff.onlyInFile.length; j++) {
            let entry = {
              id: j + 1,
              name: diff.onlyInFile[j].displayName,
              email: diff.onlyInFile[j].email,
              permission: diff.onlyInFile[j].roles[0],
              access: diff.onlyInFile[j].inheritedFrom == null ? "Direct" : "Inherited"
            };
            onlyInFile.push(entry);
          }
        }
        let d = {
          folder: diff.folder,
          file: diff.file,
          onlyInFolder: onlyInFolder,
          onlyInFile: onlyInFile,
          folderPermExpanded: false,
          filePermExpanded: false
        }
        newD.push(d);
      }
      for (const file of newFiles) {
        const permissionsArray = [];
        if (file.permissions) {
          for (let j = 0; j < file.permissions.length; j++) {
            let entry = {
              id: j + 1,
              name: file.permissions[j].displayName,
              email: file.permissions[j].email,
              permission: file.permissions[j].roles[0],
              access: file.permissions[j].inheritedFrom == null ? "Direct" : "Inherited"
            };
            permissionsArray.push(entry);
          }
        }
        let f = {
          id: i + 1,
          expanded: false,
          showFolder: false,
          name: file.name,
          change: "New File",
          original: [],
          differences: permissionsArray,
          folder: file.folder,
          children: file.children,
        }
        newF.push(f);
        i++;
      }
      for (const d of differences) {
        let change = {
          name: d.file.name,
          change: "Permission Change",
          original: { deleted: d.diff.deleted, updated: d.diff.updated.map((x) => x[0])},
          differences: { added: d.diff.added, updated: d.diff.updated.map((x) => x[1])},
        };
        diff.push(change);
      }
      setNewFiles(newF);
      setChanges(diff);
      setFolderFileDiff(newD);
      setAnalysisDone(true);
      setDeviantList(deviants);
    });
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
                <Alert variant="danger" show={sharingOption == "changes" && fileSnapshots.filter((f) => f.selected).length !== 2}>
                  <Alert.Heading>Must Select Only Two File Snapshots To Analyze Sharing Changes!</Alert.Heading>
                </Alert>
                <Alert variant="danger" show={sharingOption == "deviant" && fileSnapshots.filter((f) => f.selected).length > 1}>
                  <Alert.Heading>Must Select Only One File Snapshot To Analyze Deviant Sharing!</Alert.Heading>
                </Alert>
              </Row>
              {!analysisDone && (<>
                <Row>
                  <Col style={{justifyContent:'left', padding: '15px'}}>
                    <FloatingLabel controlId="floatingSelect" label="Analyze Sharing">
                      <Form.Select onChange={handleSelectSharingOption}>
                        {/* <option value="redundant">Redundant Sharing</option> */}
                        <option value=""></option>
                        <option value="deviant">Deviant Sharing</option>
                        <option value="folder">File-Folder Sharing Differences</option>
                        <option value="changes">Sharing Changes</option>
                      </Form.Select>
                    </FloatingLabel>
                  </Col>
                  {(sharingOption !== "changes" && sharingOption !== "deviant") ? 
                    <Col style={{justifyContent:'left', padding: '15px'}}>
                      <FloatingLabel controlId="floatingSelect" label="Selected File Snapshot">
                        <Form.Select value={selectSnapshot} onChange={handleSelectSnapshot}>
                          {fileSnapshots.map((snapshot) => (
                            <option key={snapshot.id} value={snapshot.id}>
                              {snapshot.timestamp.toLocaleString()}
                            </option>
                          ))}
                        </Form.Select>
                      </FloatingLabel>
                    </Col>
                    : <></>
                  }
                  {
                    sharingOption === "deviant" ? 
                    <>
                      <Col style={{justifyContent:'left', padding: '15px'}}>
                        <label>Threshold</label>
                        <form name="myform" oninput="range1value.value = range1.valueAsNumber">
                        <input type="range" min="51" max="100" defaultValue={threshold} onChange={(e) => {setThreshold(e.target.value)}} ></input>
                      <output name="range1value" for="range1" >{threshold}%</output>
                    </form>
                      </Col>
                    </> : <></>
                  }
                  <Col style={{textAlign: 'left', justifyContent:'left', paddingTop: '25px'}}>
                    <Button
                      disabled={sharingOption === "changes" ? fileSnapshots.filter((f) => f.selected).length !== 2 : fileSnapshots.filter((f) => f.selected).length > 1}
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
                </>)
              }
              {analysisDone && 
                <Row style={{display: 'flex', fontSize: '25px', justifyContent: 'center'}}>
                  {sharingOption === "deviant" ? "Deviant Sharing" 
                    : sharingOption === "folder" 
                      ? "File Folder Differences"
                      : "Sharing Changes"}
                </Row>
              }
              {/* {analysisDone && sharingOption === 'redundant' && <Col>
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
              </Col>} */}
              {analysisDone && sharingOption === 'deviant' && 
                <Row>
                  <Col style={{justifyContent:'left'}}>
                    <Table style={{ textAlign: "left" }}>
                      <thead style={{ borderTop: "1px solid #CFCFCF" }}>
                        <tr>
                          <th>Folder</th>
                          <th>Owner</th>
                          <th>File</th>
                          <th>Permission Different From Threshold Files</th>
                        </tr>
                      </thead>
                      <tbody>
                          {deviantList.map((d) => (<><tr>
                            <td>{d[0].split(',')[0]} </td>
                            <td>{d[0].split(',')[1]}</td>
                            <td>
                              {d[1].map((p) => ( p.length !== 0 ?
                                p.map((e) => (
                                  <>
                                    <React.Fragment>
                                      {e[1]}
                                      <br />
                                    </React.Fragment>
                                  </>))
                                  : <></>
                              ))}
                            </td>
                            <td>
                            {d[1].map((p) => ( p.length !== 0 ?
                              p.map((e) => (
                                <>
                                  <React.Fragment>
                                    {e[2] + ", " + e[3]}
                                    <br />
                                  </React.Fragment>
                                </>))
                                  : <></>
                            ))}</td>
                          </tr></>
                          ))}
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              }
              
              {analysisDone && sharingOption === 'folder' && 
                <Row>
                  <Col style={{justifyContent:'left'}}>
                    <Table style={{ textAlign: "left" }}>
                      <thead style={{ borderTop: "1px solid #CFCFCF" }}>
                        <tr>
                          <th>File</th>
                          <th>Folder</th>
                          {context[0] === "google" ? <th>Drive</th> : <></>}
                          <th colSpan={2}>Permissions Only In File</th>
                          <th colSpan={2}>Permissions Only In Folder</th>
                        </tr>
                      </thead>
                      <tbody>
                      {folderFileDiff.map((diff) => (<><tr>
                        <td>{diff.file.name}</td>
                        <td>{diff.folder.name}</td>
                        {context[0] === "google" ? <td>{diff.file.drive}</td> : <></>}
                        {diff.filePermExpanded ? 
                            ( <>
                              <td>
                                  {diff.onlyInFile.map((permission, index) => (
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
                              <td>
                                  {diff.onlyInFile.length > 2 && 
                                  <MdArrowDropUp
                                      size={24}
                                      style={{ color: "#CFCFCF" }}
                                      onClick={(e) => onExpandFilePerm(e, diff.file)}
                                  />
                                  }
                              </td>
                            </> )
                            :
                            ( <>
                              <td>
                                  {diff.onlyInFile
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
                              <td>
                                  {diff.onlyInFile.length > 2 && 
                                  <MdArrowDropDown
                                      size={24}
                                      style={{ color: "#CFCFCF" }}
                                      onClick={(e) => onExpandFilePerm(e, diff.file)}
                                  />
                                  }
                              </td>
                            </>)
                        }
                        {diff.folderPermExpanded ? 
                            ( <>
                              <td>
                                  {diff.onlyInFolder.map((permission, index) => (
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
                              <td>
                                  {diff.onlyInFolder.length > 2 && 
                                  <MdArrowDropUp
                                      size={24}
                                      style={{ color: "#CFCFCF" }}
                                      onClick={(e) => onExpandFolderPerm(e, diff.file)}
                                  />
                                  }
                              </td>
                            </> )
                            :
                            ( <>
                              <td>
                                  {diff.onlyInFolder
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
                              <td>
                                  {diff.onlyInFolder.length > 2 && 
                                  <MdArrowDropDown
                                      size={24}
                                      style={{ color: "#CFCFCF" }}
                                      onClick={(e) => onExpandFolderPerm(e, diff.file)}
                                  />
                                  }
                              </td>
                            </>)
                        }
                        </tr></>))}
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              }
              {analysisDone && sharingOption === 'changes' && 
                <Row style={{ overflow: "auto" }}>
                  <Col style={{justifyContent:'left'}}>
                    <Table style={{ textAlign: "left" }}>
                      <thead style={{ borderTop: "1px solid #CFCFCF" }}>
                        <tr>
                          <th>File</th>
                          <th>Change</th>
                          <th>File Snapshot 1: {twoSnapshots.snapshot1.toLocaleString()}</th>
                          <th colSpan={2}>File Snapshot 2: {twoSnapshots.snapshot2.toLocaleString()}</th>
                        </tr>
                      </thead>
                      <tbody>
                      {newFiles.map((file) => (<><tr>
                        <td>{file.name}</td>
                        <td>{file.change}</td>
                        <td>{file.original}</td>
                        {file.expanded ? 
                            ( <>
                              <td>
                                  {file.differences.map((permission, index) => (
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
                              <td>
                                  {file.differences.length > 2 && 
                                  <MdArrowDropUp
                                      size={24}
                                      style={{ color: "#CFCFCF" }}
                                      onClick={(e) => onExpandPerm(e, file)}
                                  />
                                  }
                              </td>
                            </> )
                            :
                            ( <>
                              <td>
                                  {file.differences
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
                              <td>
                                  {file.differences.length > 2 && 
                                  <MdArrowDropDown
                                      size={24}
                                      style={{ color: "#CFCFCF" }}
                                      onClick={(e) => onExpandPerm(e, file)}
                                  />
                                  }
                              </td>
                            </>)
                        }
                        </tr></>))}
                        {changes.map((file) => (<><tr>
                          <td>{file.name}</td>
                          <td>{file.change}</td>
                          <td>
                              {file.original.deleted.length !== 0 ? <>Deleted:<br/></> : <></>}
                              {file.original.deleted.map((change) => ( <>
                              <React.Fragment key={change}>
                                  {change[2] + ", " + change[1][0]}
                              </React.Fragment>
                              </>
                              ))}
                              {file.original.updated.length !== 0 ? <>Updated:<br/></> : <></>}
                              {file.original.updated.map((change) => ( <>
                              <React.Fragment key={change}>
                                  {change[2] + ", " + change[1][0]}
                              </React.Fragment>
                              </>
                              ))}
                          </td>
                          <td>
                              {file.differences.added.length !== 0 ? <>Added:<br/></> : <></>}
                              {file.differences.added.map((change) => ( <>
                              <React.Fragment key={change}>
                                  {change[2] + ", " + change[1][0]}
                              </React.Fragment>
                              </>
                              ))}
                              {file.differences.updated.length !== 0 ? <>After Update:<br/></> : <></>}
                              {file.differences.updated.map((change) => ( <>
                              <React.Fragment key={change}>
                                  {change[2] + ", " + change[1][0]}
                              </React.Fragment>
                              </>
                              ))}
                          </td>
                          <td>
                            <MdArrowDropDown
                              size={24}
                              style={{ opacity: "0.0" }}
                            />
                          </td>
                        </tr></>))}
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              }
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  );
}
