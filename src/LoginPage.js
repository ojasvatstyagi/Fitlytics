import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signUp, confirmSignUp, signIn } from "./CognitoService"; // Assuming CognitoService.js is in the same directory
import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css"; // Already imported in App.js or index.js
import "./LoginPage.css"; // Assuming LoginPage.css is in the same directory

// Regex for strong password: at least 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/;

const LoginPage = ({ onLogin }) => {
  const [isSigningUp, setIsSigningUp] = useState(false); // True if user is in sign-up mode
  const [isConfirming, setIsConfirming] = useState(false); // True if user is in email confirmation mode
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    gender: "",
    birthdate: "",
    confirmationCode: "",
  });

  const navigate = useNavigate();

  // Effect to pre-fill email from localStorage if entering confirmation state without email in formData
  // This is a robustness measure, e.g., if state was lost due to a refresh and isConfirming was true.
  useEffect(() => {
    if (isConfirming && !formData.email) {
      const pendingEmailFromStorage = localStorage.getItem("pendingEmail");
      if (pendingEmailFromStorage) {
        setFormData((prev) => ({ ...prev, email: pendingEmailFromStorage }));
      }
    }
  }, [isConfirming, formData.email]); // Rerun if isConfirming or formData.email changes

  // Handles changes in form input fields
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validates email format
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  // Validates birthdate format (YYYY-MM-DD). Note: type="date" input also provides validation.
  const validateBirthdate = (birthdate) =>
    /^\d{4}-\d{2}-\d{2}$/.test(birthdate);

  // Handles the sign-up process
  const handleSignUp = async () => {
    const { email, password, name, gender, birthdate } = formData;
    // Basic field validation
    if (!email || !password || !name || !gender || !birthdate) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!validateEmail(email)) {
      toast.error("Invalid email format.");
      return;
    }
    if (!strongPasswordRegex.test(password)) {
      toast.error(
        "Password must have at least 8 characters, including uppercase, lowercase, number, and special character."
      );
      return;
    }
    if (!validateBirthdate(birthdate)) {
      toast.error("Birthdate must be in YYYY-MM-DD format.");
      return;
    }

    try {
      await signUp(email, password, name, gender, birthdate);
      localStorage.setItem("pendingEmail", email); // Store email for confirmation step
      toast.success(
        "Sign-up successful! Check your email for the confirmation code."
      );
      setIsSigningUp(false);
      setIsConfirming(true);
      // Email field remains populated for the confirmation form
    } catch (error) {
      toast.error(error.message || "Sign-up failed.");
    }
  };

  const handleConfirmation = async () => {
    let emailToConfirm = formData.email;
    const { confirmationCode } = formData;

    // Fallback to localStorage if email isn't in form state (e.g., after a refresh)
    if (!emailToConfirm && isConfirming) {
      emailToConfirm = localStorage.getItem("pendingEmail");
    }

    if (!emailToConfirm) {
      toast.error("Email address is missing. Please try signing up again.");
      setIsConfirming(false); // Revert to sign-in/sign-up view
      localStorage.removeItem("pendingEmail");
      return;
    }
    if (!confirmationCode) {
      toast.error("Please enter the confirmation code.");
      return;
    }

    try {
      await confirmSignUp(emailToConfirm, confirmationCode);
      toast.success("Email confirmed! You can now sign in.");
      setIsConfirming(false);
      // Reset form for sign-in: pre-fill email, clear other sensitive fields
      setFormData({
        email: emailToConfirm, // Keep email pre-filled for convenience
        password: "",
        name: "",
        gender: "",
        birthdate: "",
        confirmationCode: "",
      });
      localStorage.removeItem("pendingEmail"); // Clean up pending email from storage
    } catch (error) {
      toast.error(error.message || "Confirmation failed.");
      // Do not clear pendingEmail here, user might want to retry confirmation with the same code/email
    }
  };

  // Handles the sign-in process
  const handleSignIn = async () => {
    const { email, password } = formData;

    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    try {
      await signIn(email, password);

// Store email so it's available globally
      localStorage.setItem("email", email);

// You probably already do this:
      localStorage.setItem("isAuthenticated", "true");

      toast.success("Sign-in successful!");
      onLogin(); // Callback to update App's authentication state
      navigate("/home"); // Navigate to home page
    } catch (error) {
      // Provide more specific error messages
      let errorMessage = "Sign-in error.";
      if (error.message) {
        if (error.message.includes("User does not exist")) {
          errorMessage = "No account found for this email. Please sign up.";
        } else if (error.message.includes("Incorrect username or password")) {
          errorMessage = "Incorrect email or password.";
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  // Handles form submission based on the current mode (sign-up, confirm, or sign-in)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSigningUp) handleSignUp();
    else if (isConfirming) handleConfirmation();
    else handleSignIn();
  };

  // Toggles between Sign In and Sign Up views
  const toggleFormMode = () => {
    setIsSigningUp(!isSigningUp);
    setIsConfirming(false); // Always exit confirmation mode when toggling
    if (isConfirming || isSigningUp) {
      // If was confirming or signing up, now going to sign in
      localStorage.removeItem("pendingEmail"); // Clear pending email
    }
    // Reset all form fields when toggling
    setFormData({
      email: "",
      password: "",
      name: "",
      gender: "",
      birthdate: "",
      confirmationCode: "",
    });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="gym-logo">
            <h2 className="card-title">
              {isSigningUp
                ? "JOIN THE IRON TRIBE"
                : isConfirming
                ? "VERIFY YOUR STRENGTH"
                : "UNLEASH YOUR POTENTIAL"}
            </h2>
            <div className="gym-line"></div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {/* Fields for Sign Up */}
            {isSigningUp && (
              <>
                <div className="input-group">
                  <label htmlFor="name">FULL NAME</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    className="input-field"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="gender">GENDER</label>
                  <select
                    id="gender"
                    name="gender"
                    className="input-field"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">SELECT GENDER</option>
                    <option value="female">FEMALE</option>
                    <option value="male">MALE</option>
                    <option value="other">OTHER</option>
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="birthdate">BIRTHDATE</label>
                  <input
                    id="birthdate"
                    type="date" // Native date picker
                    name="birthdate"
                    className="input-field"
                    value={formData.birthdate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}

            {/* Email field (common for all modes, but might be read-only in confirmation) */}
            <div className="input-group">
              <label htmlFor="email">EMAIL</label>
              <input
                id="email"
                type="email"
                name="email"
                className="input-field"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={
                  isConfirming && !!localStorage.getItem("pendingEmail")
                } // Disable if confirming and email came from storage
              />
            </div>

            {/* Password field (for Sign Up and Sign In) */}
            {(isSigningUp || !isConfirming) && (
              <div className="input-group">
                <label htmlFor="password">PASSWORD</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  className="input-field"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            {/* Confirmation Code field (only for Confirmation mode) */}
            {isConfirming && (
              <div className="input-group">
                <label htmlFor="confirmationCode">CONFIRMATION CODE</label>
                <input
                  id="confirmationCode"
                  type="text"
                  name="confirmationCode"
                  className="input-field"
                  placeholder="Enter confirmation code"
                  value={formData.confirmationCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            <div className="button-container">
              <button type="submit" className="action-btn">
                {isSigningUp ? "SIGN UP" : isConfirming ? "CONFIRM" : "SIGN IN"}
              </button>

              {/* Toggle button between Sign In and Sign Up (not shown during confirmation) */}
              {!isConfirming && (
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={toggleFormMode}
                >
                  {isSigningUp ? "BACK TO SIGN IN" : "CREATE ACCOUNT"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
