import React from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import { MdClose } from "react-icons/md";
import "bootstrap/dist/css/bootstrap.min.css";
import "../app.css";
import { useStore } from "../store";

export default function EditPermission() {
  const setEditPermission = useStore((state) => state.setEditPermission);

  return (
    <div style={{ height: "100vh", borderLeft: "1px solid #CFCFCF" }}>
      <Container fluid className={"no-gutters mx-0 px-0"}>
        <Stack gap={5}>
          <Stack style={{ paddingTop: "4px" }}>
            <Container fluid className={"no-gutters mx-0 px-0"}>
              <MdClose
                size={24}
                style={{ float: "right", color: "#CFCFCF" }}
                onClick={setEditPermission}
              />
            </Container>
            <FilePermission />
          </Stack>
          <AddPermission />
          <RemovePermission />
        </Stack>
      </Container>
    </div>
  );
}

function FilePermission() {
    return (
        <Container>
            File Permission
        </Container>
    )
}

function AddPermission() {
    return (
        <Container>
            Add Permission
        </Container>
    )
}

function RemovePermission() {
    return (
        <Container>
            Remove Permission
        </Container>
    )
}
