import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import LoginPage from "./LoginPage"; // Assuming LoginPage.js is in the same directory
import HomePage from "./HomePage"; // Assuming HomePage.js is in the same directory
import { getCurrentUser } from "./CognitoService"; // Assuming CognitoService.js is in the same directory
import { ToastContainer } from "react-toastify";

const App = () => {
  // State to manage authentication status
  // Initializes from localStorage to persist login state across sessions
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });

  // Effect to check current user status on component mount
  useEffect(() => {
    // Assuming getCurrentUser() synchronously returns the user or null
    const user = getCurrentUser();
    const authenticated = !!user; // True if user object exists, false otherwise
    setIsAuthenticated(authenticated);
    localStorage.setItem("isAuthenticated", authenticated.toString());
  }, []);
  // Handler for user logout
  const handleLogout = () => {
    // signOut(); // Call Cognito sign out utility
    setIsAuthenticated(false);
    localStorage.setItem("isAuthenticated", "false");
    // No need to navigate here, the Navigate component below will handle it
  };

  return (
    <Router>
      {/* ToastContainer for displaying notifications */}
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
          // element={
          //   isAuthenticated ? (
          //     <HomePage onLogout={handleLogout} />
          //   ) : (
          //     <Navigate to="/login" replace /> // Use replace to avoid back button to home
          //   )
          // }
          element={<HomePage onLogout={handleLogout} />}
        />
        <Route
          path="/home"
          element={
            isAuthenticated ? (
              <HomePage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace /> // Use replace to avoid back button to home
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
