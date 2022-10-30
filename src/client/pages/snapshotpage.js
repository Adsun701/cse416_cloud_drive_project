import React from "react";
import Header from '../components/header';
import Container from "react-bootstrap/Container";
import SideBar from "../components/sidebar";
import DataTable from "../components/datatable";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useNavigate, useLocation } from "react-router-dom";

export default function SnapshotPage() {
  return (
    <div>
      <Header />
      Snapshot Page
      <Container fluid className={"no-gutters mx-0 px-0"}>
        <div className="row no-gutters">
          <Row className="no-gutters">
            <Col sm={2} className="px-0">
              <SideBar />
            </Col>
            <Col sm={2} className="px-0">User
              <Row className="no-gutters">
                Snapshots
              </Row>
              <Row className="no-gutters">
                Recent Search Queries
              </Row>
              <Row className="no-gutters">
                Access Control Policies
              </Row>
            </Col>
            <Col sm={6} className="px-0">Access Control Policies
              <Row className="no-gutters">
              </Row>
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  );
}
