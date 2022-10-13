import React from 'react';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../app.css';

export default function SideBar() {
  const navigate = useNavigate();

  const handleSearch = () => {
    navigate('/search');
  };

  const handleSnapshot = () => {
    navigate('/snapshot');
  };

  return (
    <Nav defaultActiveKey="/home" className="flex-column" style={{ textAlign: 'left' }}>
      <Button style={{
        background: 'white', borderColor: '#CFCFCF', borderRadius: '30px', color: '#3A3A3A'
      }}
      >
        Add Snapshot
      </Button>
      <Nav.Link onClick={handleSearch} style={{ color: '#3A3A3A' }}>Search</Nav.Link>
      <Nav.Link onClick={handleSnapshot} style={{ color: '#3A3A3A' }}>Snapshot</Nav.Link>
    </Nav>
  );
}
