import React from "react";
import Header from '../components/header';
import Container from "react-bootstrap/Container";
import SideBar from "../components/sidebar";

export default function SnapshotPage() {
  return (
    <div>
      <Header />
      <Container style={{ width: "100%" }}>
        Snapshot Page
        <Container className="flex-left" style={{ width: "20%" }}>
          <SideBar />
        </Container>
      </Container>
    </div>
  );
}
