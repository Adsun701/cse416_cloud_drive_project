import React, { useState, useEffect } from "react";
import Header from '../components/header';
import SideBar from "../components/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import AxiosClient from "../AxiosClient";

export default function AccessControlPage() {

  let [accesscontrols, setAccessControls] = useState([]);
  let [accessControlChanged, setAccessControlChanged] = useState(0);
  const [requirementStr, setRequirementStr] = useState("");
  const [arStr, setarStr] = useState("");
  const [awStr, setawStr] = useState("");
  const [drStr, setdrStr] = useState("");
  const [dwStr, setdwStr] = useState("");

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
            <li>Requirement: {policy.requirement} <p onClick={() => handleDeleteRequirement(policy.requirement)}>Delete</p></li>
            <ul>
              <li>Allowed Readers: {policy.ar.map(ar => <li>{ar}</li>)}</li>
            </ul>
            <ul>
              <li>Denied Readers: {policy.dr.map(dr => <li>{dr}</li>)}</li>
            </ul>
            <ul>
              <li>Allowed Writers: {policy.aw.map(aw => <li>{aw}</li>)}</li>
            </ul>
            <ul>
              <li>Denied Writers: {policy.dw.map(dw => <li>{dw}</li>)}</li>
            </ul>
            </div>
          ))} 
          </ol>
          </div>
       
    </div>
  );
}
