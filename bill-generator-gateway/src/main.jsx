import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import keycloak from "./keycloak";

const root = ReactDOM.createRoot(document.getElementById("root"));

// Initialize Keycloak
keycloak.init({ 
  onLoad: 'login-required', 
  checkLoginIframe: false // <--- KEEPS IT FROM CRASHING ON HTTP
}).then((authenticated) => {
  if (authenticated) {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    root.render(<h1>Not Authenticated</h1>);
  }
}).catch(err => {
  console.error("Keycloak Init Error", err);
  root.render(<div style={{padding: 20}}><h1>Login Failed</h1><p>{err?.message}</p></div>);
});