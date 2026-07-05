import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./routes/App";
import { AuthProvider } from "./auth/AuthContext";
import IdleTimer from "./components/IdleTimer";

// 🔴 THIS LINE IS WHAT YOU WERE MISSING
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <IdleTimer />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
