import React, { useState } from "react";
import Header from '../components/header';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import SideBar from "../components/sidebar";
import { useNavigate } from "react-router-dom";
import AxiosClient from "../AxiosClient";

export default function GroupSnapshotPage() {
    const [name, setName] = useState()
    const [address, setAddress] = useState()
    const [timestamp, setTimestamp] = useState()
    const [file, setFile] = useState()

    function handleName(event) {
        setName(event.target.value)
    }
    function handleAddress(event) {
        setAddress(event.target.value)
    }
    function handleTimestamp(event) {
        setTimestamp(event.target.value)
    }
    function handleFile(event) {
      setFile(event.target.files[0])
    }
    function handleSubmit(event) {
        let formData = new FormData();
        formData.append("groupname", name);
        formData.append("groupaddress", address);
        formData.append("timestamp", timestamp);
        formData.append('memberpagehtml', file);
        AxiosClient.post('/googlegroupsnapshot/snapshot', formData)
          .then((res) => {
            console.log("success");
          });
    }

  return (
    <div>
      <Header />
      <Container fluid className={"no-gutters mx-0 px-0"}>Snapshot Page
        <div className="row no-gutters">
          <Row className="no-gutters">
            <>
              <Col sm={2} className="px-0">
                <SideBar />
              </Col>
              <Col sm={10} className="px-0">
                <form method="post" encType="multipart/form-data" onSubmit={handleSubmit} >
                <label>
                  Group Name:
                  <input type="text" name="groupname" onChange={handleName} />
                </label>
                <br />
                <label>
                  Group Address:
                  <input type="text" name="groupaddress" onChange={handleAddress} />
                </label>
                <br />
                <label>
                Timestamp:
                <input type="datetime-local" name="timestamp" onChange={handleTimestamp} />
                </label>
                <br />
                <label>
                  Html File:
                  <input type="file" name="memberpagehtml" accept="text/html" onChange={handleFile} />
                </label>
                <br />
                <button type="button" onClick={handleSubmit}>Submit</button>
                </form>
              </Col>
            </>
          </Row>
        </div>
      </Container>
    </div>
  );
}
