import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUp, confirmSignUp, signIn } from "./CognitoService";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./LoginPage.css";

const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/;

const LoginPage = ({ onLogin }) => {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    gender: "",
    birthdate: "",
    confirmationCode: "",
  });

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateBirthdate = (birthdate) =>
    /^\d{4}-\d{2}-\d{2}$/.test(birthdate);

  const handleSignUp = async () => {
    const { email, password, name, gender, birthdate } = formData;

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
      localStorage.setItem("pendingEmail", email);
      toast.success(
        "Sign-up successful! Check your email for the confirmation code."
      );
      setIsSigningUp(false);
      setIsConfirming(true);
    } catch (error) {
      toast.error(error.message || "Sign-up failed.");
    }
  };

  const handleConfirmation = async () => {
    const { email, confirmationCode } = formData;

    if (!confirmationCode) {
      toast.error("Please enter the confirmation code.");
      return;
    }

    try {
      await confirmSignUp(email, confirmationCode);
      toast.success("Email confirmed! You can now sign in.");
      setIsConfirming(false);
    } catch (error) {
      toast.error(error.message || "Confirmation failed.");
    }
  };

  const handleSignIn = async () => {
    const { email, password } = formData;

    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    try {
      await signIn(email, password);
      toast.success("Sign-in successful!");
      onLogin();
      navigate("/home");
    } catch (error) {
      toast.error(
        error.message.includes("User does not exist")
          ? "No account found for this email. Please sign up."
          : error.message.includes("Incorrect username or password")
          ? "Incorrect email or password."
          : error.message || "Sign-in error."
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSigningUp) handleSignUp();
    else if (isConfirming) handleConfirmation();
    else handleSignIn();
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
                    type="date"
                    name="birthdate"
                    className="input-field"
                    value={formData.birthdate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}

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
              />
            </div>

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

              {!isConfirming && (
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => {
                    setIsSigningUp(!isSigningUp);
                    setIsConfirming(false);
                    setFormData({
                      email: "",
                      password: "",
                      name: "",
                      gender: "",
                      birthdate: "",
                      confirmationCode: "",
                    });
                  }}
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
