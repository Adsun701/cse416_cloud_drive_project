import React, { useContext } from "react";
import { Context } from "../Context";
import Header from "../components/header";
import Container from "react-bootstrap/Container";
import SideBar from "../components/sidebar";

export default function SearchPage() {
  const [context, setContext] = useContext(Context);
  console.log("CONTEXT");
  console.log(context);
  console.log("CONTEXT FIN");
  return (
    <div>
      <Header />
      <Container style={{ width: "100%" }}>
        Search Page - {context[0]}
        <Container className="flex-left" style={{ width: "20%" }}>
          <SideBar />
        </Container>
      </Container>
    </div>
  );
}
