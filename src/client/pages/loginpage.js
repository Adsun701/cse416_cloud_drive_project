import React from "react";
import { useState, useContext, useEffect } from "react";
import { Context } from "../Context";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import "bootstrap/dist/css/bootstrap.min.css";
import "../app.css";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "react-google-login";
import { gapi } from "gapi-script";
import { MicrosoftLogin } from "react-microsoft-login";
import AxiosClient from "../AxiosClient";

export default function LoginPage() {
  const [context, setContext] = useContext(Context);

  gapi.load("client:auth2", () => {
    gapi.client.init({
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive",
    });
  });

  const navigate = useNavigate();

  const handleFail = (err) => {
    console.log("failed login", err);
  };

  const handleGoogle = async (res) => {
    console.log("GOOGLE");
    console.log(res);
    setContext(["google", ""]);
    AxiosClient.post("/auth", {
      clouddrive: "google",
      accessToken: res.accessToken,
      name: res.profileObj.name,
      email: res.profileObj.email,
    }).then((response) => {
      // set a state here to change the page upon load
      AxiosClient.get("/google/last15modifiedfiles").then((res) => {
        navigate("search", { state: { files: res.data }} );
      });
    });
  };

  const handleMicrosoft = async (err, data, msal) => {
    console.log("MICROSOFT");
    console.log(data);
    setContext(["microsoft", msal]);

    AxiosClient.post("/auth", {
      clouddrive: "microsoft",
      accessToken: data.accessToken,
      name: data.account.name,
      email: data.mail,
    }).then((response) => {
      // set a state here to change the page upon load
      AxiosClient.get("/last15modifiedfiles").then((res) => {
        navigate("search", { state: { files: res.data }} );
      });
    });
    navigate("search");
  };

  return (
    <Container fluid>
      <Row className="d-flex justify-content-md-center align-items-center vh-100">
        <h1 style={{ fontWeight: "lighter" }}>Cloud Drive Manager</h1>
        <Col>
          <GoogleLogin
            clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
            buttonText="Log in with Google"
            onSuccess={handleGoogle}
            onFailure={handleFail}
            isSignedIn={true}
            cookiePolicy={"single_host_origin"}
          />
        </Col>
        <Col>
          <MicrosoftLogin
            clientId={process.env.REACT_APP_MS_CLIENT_ID}
            redirectUri={process.env.REACT_APP_MS_REDIRECT_URI}
            postLogoutRedirectUri={
              process.env.REACT_APP_POST_LOGOUT_REDIRECT_URI
            }
            withUserData={true}
            graphScopes={[
              "User.Read",
              "Files.Read",
              "Files.ReadWrite.All",
              "Sites.ReadWrite.All",
            ]}
            authCallback={handleMicrosoft}
          />
        </Col>
        <Dropdown>
          <Dropdown.Toggle
            style={{
              background: "white",
              borderColor: "white",
              color: "black",
            }}
          >
            Choose other supported Drives
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item style={{ textAlign: "center" }}>
              Other Drive
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Row>
    </Container>
  );
}
