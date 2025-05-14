import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import LoginPage from "./LoginPage";
import HomePage from "./HomePage";
import { getCurrentUser } from "./CognitoService";
import { ToastContainer } from "react-toastify";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });

  // Updated to async effect
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser(); // Await async getCurrentUser
        const authenticated = !!user;
        setIsAuthenticated(authenticated);
        localStorage.setItem("isAuthenticated", authenticated.toString());
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
        localStorage.setItem("isAuthenticated", "false");
      }
    };
    checkUser();
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem("isAuthenticated", "false");
  };

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        draggable
        pauseOnHover
      />
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
          element={
            isAuthenticated ? (
              <HomePage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
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
