import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import LoginPage from "./LoginPage";
import HomePage from "./HomePage";
import { getCurrentUser, signOut } from "./CognitoService";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });

  useEffect(() => {
    const email = getCurrentUser();
    const authenticated = !!email;
    setIsAuthenticated(authenticated);
    localStorage.setItem("isAuthenticated", authenticated.toString());
  }, []);

  const handleLogout = () => {
    signOut();
    setIsAuthenticated(false);
    localStorage.setItem("isAuthenticated", "false");
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={() => {
                setIsAuthenticated(true);
                localStorage.setItem("isAuthenticated", "true");
              }}
            />
          }
        />
        <Route
          path="/home"
          // element={
          //   isAuthenticated ? (
          //     <HomePage onLogout={handleLogout} />
          //   ) : (
          //     <Navigate to="/login" />
          //   )
          // }
          element={<HomePage />}
        />
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/home" : "/login"} />}
        />
      </Routes>
    </Router>
  );
};

export default App;
