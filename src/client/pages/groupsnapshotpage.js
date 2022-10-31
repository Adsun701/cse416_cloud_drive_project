import React, { useState } from "react";
import Header from '../components/header';
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
          })
    }

  return (
    <div>
      <Header />
      Snapshot Page
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
    </div>
  );
}
