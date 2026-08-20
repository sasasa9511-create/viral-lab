import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AnalysisPage from "./AnalysisPage";
import "../styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

function RoutedApp() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/analysis") {
    return <AnalysisPage user={null} onToast={() => {}} />;
  }
  return <App />;
}

root.render(
  <React.StrictMode>
    <RoutedApp />
  </React.StrictMode>
);
