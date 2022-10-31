import React from 'react';
import { useState, useContext } from "react";
import { Context } from "../Context";
import { GoogleLogout } from 'react-google-login';
import { useNavigate } from 'react-router-dom';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Dropdown from 'react-bootstrap/Dropdown';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../app.css';
import AxiosClient from "../AxiosClient";

export default function Header() {
  const [context, setContext] = useContext(Context);
  const navigate = useNavigate();

  let handleLogout = () => {
    if (context[0] === "google") {
      AxiosClient.post('/logout');
      navigate('/');
    } else if (context[0] === "microsoft") {
      AxiosClient.post('/logout');
      context[1].logout();
    } else {

    }
  }

  return (
    <Navbar bg="white" style={{ borderBottom: '1px solid #CFCFCF' }}>
      <Nav className="container-fluid">
        <Nav.Item style={{ paddingLeft: 20 }}>
          <Navbar.Brand>Cloud Drive Manager</Navbar.Brand>
        </Nav.Item>
        <Nav.Item className="ml-auto">
          <Dropdown>
            <Dropdown.Toggle id="header-dropdown" className="rounded-circle" style={{ background: 'white', borderColor: '#CFCFCF' }}>
              <Navbar.Text>A</Navbar.Text>
            </Dropdown.Toggle>
            <Dropdown.Menu className="dropdown-menu-end" style={{ textAlign: "center" }} >
              {context[0] === "google" ? 
              <GoogleLogout
              clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
              buttonText="Logout"
              onLogoutSuccess={handleLogout}
              >
            </GoogleLogout>
              :
              (<Dropdown.Item style={{ textAlign: 'center' }} onClick={handleLogout}>Logout</Dropdown.Item>)
              }              
            </Dropdown.Menu>
          </Dropdown>
        </Nav.Item>
      </Nav>
    </Navbar>
  );
}
