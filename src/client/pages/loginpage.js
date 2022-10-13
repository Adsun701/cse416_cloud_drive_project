import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../app.css';

export default function LoginPage() {
  const handleGoogle = () => {
    window.open("http://localhost:8080/google/auth", "_blank");
  };

  const handleMicrosoft = () => {
    window.open("http://localhost:8080/", "_blank");
  };

  return (
    <Container fluid>
      <Row className="d-flex justify-content-md-center align-items-center vh-100">
        <h1 style={{ fontWeight: 'lighter' }}>Cloud Drive Manager</h1>
        <Container style={{ width: '100%' }}>
          <Button
            className="me-5"
            size="lg"
            style={{
              width: '40%', background: 'white', color: 'black', borderColor: '#CFCFCF'
            }}
            onClick={handleGoogle}
          >
            Sign in with Google
          </Button>
          <Button
            size="lg"
            style={{
              width: '40%', background: 'white', color: 'black', borderColor: '#CFCFCF'
            }}
            onClick={handleMicrosoft}
          >
            Sign in with Microsoft
          </Button>
        </Container>
        <Dropdown>
          <Dropdown.Toggle style={{ background: 'white', borderColor: 'white', color: 'black' }}>
            Choose other supported Drives
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item style={{ textAlign: 'center' }}>Other Drive</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Row>
    </Container>
  );
}
