import React from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Dropdown from 'react-bootstrap/Dropdown';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../app.css';

export default function Header() {
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
            <Dropdown.Menu className="dropdown-menu-end">
              <Dropdown.Item style={{ textAlign: 'center' }} href="#/logout">Logout</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav.Item>
      </Nav>
    </Navbar>
  );
}
