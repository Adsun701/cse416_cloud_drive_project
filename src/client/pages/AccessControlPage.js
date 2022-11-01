import React, { useState, useEffect } from "react";
import Header from '../components/header';
import SideBar from "../components/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import AxiosClient from "../AxiosClient";

export default function AccessControlPage() {

  let [accesscontrols, setAccessControls] = useState([]);
  let [accessControlChanged, setAccessControlChanged] = useState(0);
  let [change, setChange] = useState(0);
  const [requirementStr, setRequirementStr] = useState("");
  const [arStr, setarStr] = useState("");
  const [awStr, setawStr] = useState("");
  const [drStr, setdrStr] = useState("");
  const [dwStr, setdwStr] = useState("");
  const [newEdit, setNewEditValue] = useState("");
  const [newValue, setNewValue] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      AxiosClient.get("/getaccesscontrolpolicies").then((response) => {
        console.log(response.data);
        setAccessControls(response.data);
        console.log("access controls");
        console.log(accesscontrols);
      })
    }
    fetchData();
  }, [accessControlChanged]);

let fetchData = async() => {
  AxiosClient.get("/getaccesscontrolpolicies").then((response) => {
    console.log(response.data);
    setAccessControls(response.data);
    setChange(change+1);
  }).catch();
}

  let handleAddNewAccessControl = async (e) => {
    e.preventDefault();
    AxiosClient.post("/addnewaccesscontrolpolicies", {
      requirement: requirementStr,
      ar: arStr,
      dr: drStr,
      aw: awStr,
      dw: dwStr
    }).then(setAccessControlChanged(accessControlChanged+1)).catch();
  }

  let handleDeleteRequirement = async (requirement) => {
    AxiosClient.post("/deleteaccesscontrolpolicy", {
      requirement: requirement
    }).then((res)=> {
      setAccessControlChanged(accessControlChanged+1);
    }).catch();
  }

  let handleAddUpdateAccessControl = async (requirement, type) => {
    AxiosClient.post("/updateaccesscontrolpolicy", {
      requirement: requirement,
      type: type,
      newValue: newValue
    }).then((res)=> {
      setAccessControlChanged(accessControlChanged+1);
      fetchData();
    }).catch();
  }

  let handleEditAccessControl = async(requirement, type, prevControl) => {
    AxiosClient.post("/editaccesscontrol", {
      requirement: requirement,
      type: type, 
      prevControl: prevControl,
      newControl: newEdit
    }).then((res) => {
      setAccessControlChanged(accessControlChanged+1);
      fetchData();
    }).catch();
  }

  return (
    <div>
        <Header/>
        <SideBar/>
        <h2>Access Control Policies</h2>
        
          <div>
          <h3> Add new Access Control</h3>
        <form onSubmit={handleAddNewAccessControl}>
          <label for="requirement">Requirement</label><br/>
          <input type="text" id="requirement" name="requirement" onChange={(e) => setRequirementStr(e.target.value)}/><br/>
          <br/>
          <label for="ar">Allowed Readers</label><br/>
          <input type="text" id="ar" name="ar" onChange={(e) => setarStr(e.target.value)}/><br/>
          <br/>
          <label for="dr">Denied Readers</label><br/>
          <input type="text" id="dr" name="dr" onChange={(e) => setdrStr(e.target.value)}/><br/>
          <br/>
          <label for="aw">Allowed Writers</label><br/>
          <input type="text" id="aw" name="aw" onChange={(e) => setawStr(e.target.value)}/><br/>
          <br/>
          <label for="dw">Denied Writers</label><br/>
          <input type="text" id="dw" name="dw" onChange={(e) => setdwStr(e.target.value)}/><br/>
          <br/>
          <input type="submit" value="Add"/>
        </form>
        </div>
       
          <div>
          <h3>Updating Access Controls</h3>
          <ol>
          {
           accesscontrols.map((policy) => (
           <div>
            <li>Requirement: {policy.requirement} <button onClick={() => handleDeleteRequirement(policy.requirement)}>Delete</button></li>
            <ul>
              <li>Allowed Readers: {policy.ar.map(ar => <li><input type="text" onChange={(e) => setNewEditValue(e.target.value)} defaultValue={ar}/>
              <button onClick={() => handleEditAccessControl(policy.requirement, "ar", ar)}>Edit</button>
              </li>)} <input type="text" onChange={(e) => setNewValue(e.target.value)}></input><button onClick={() => handleAddUpdateAccessControl(policy.requirement, "ar")}>Add</button></li>
            </ul>
            <ul>
              <li>Denied Readers: {policy.dr.map(dr => <li><input type="text" onChange={(e) => setNewEditValue(e.target.value)} defaultValue={dr}/>
              <button onClick={() => handleEditAccessControl(policy.requirement, "dr", dr)}>Edit</button>
              </li>)}<input type="text" onChange={(e) => setNewValue(e.target.value)}></input><button onClick={() => handleAddUpdateAccessControl(policy.requirement, "dr")}>Add</button></li>
            </ul>
            <ul>
              <li>Allowed Writers: {policy.aw.map(aw => <li><input type="text" onChange={(e) => setNewEditValue(e.target.value)} defaultValue={aw}/>
              <button onClick={() => handleEditAccessControl(policy.requirement, "aw", aw)}>Edit</button>
              </li>)}<input type="text" onChange={(e) => setNewValue(e.target.value)}></input><button onClick={() => handleAddUpdateAccessControl(policy.requirement, "aw")}>Add</button></li>
            </ul>
            <ul>
              <li>Denied Writers: {policy.dw.map(
                dw => <li><input type="text" onChange={(e) => setNewEditValue(e.target.value)} defaultValue={dw}/>
                <button onClick={() => handleEditAccessControl(policy.requirement, "dw", dw)}>Edit</button>
                </li>)}<input type="text" onChange={(e) => setNewValue(e.target.value)}></input>
                <button onClick={() => handleAddUpdateAccessControl(policy.requirement, "dw")}>Add</button></li>
            </ul>
            </div>
          ))} 
          </ol>
          </div>
       
    </div>
  );
}
