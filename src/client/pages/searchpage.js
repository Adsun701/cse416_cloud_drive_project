import React, { useContext } from "react";
import { Context } from "../Context";
import Header from "../components/header";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import SideBar from "../components/sidebar";
import DataTable from "../components/datatable";

export default function SearchPage() {
  const [context, setContext] = useContext(Context);
  console.log("CONTEXT");
  console.log(context);
  console.log("CONTEXT FIN");
  return (
    <div>
      <Header />
      <Container fluid className={"no-gutters mx-0 px-0"}>
        <div class="row no-gutters">
          <Row noGutters={true}>
            <Col sm={2}>
              <SideBar />
            </Col>
            <Col sm={10}>
              <DataTable />
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  );
}
