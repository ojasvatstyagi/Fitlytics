// src/services/CognitoService.js
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

// Initialize Cognito client (adjust region if needed)
const client = new CognitoIdentityProviderClient({
  region: "us-east-1",
});

// This should match the App Client ID you configured in AWS Cognito
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;

// For an extra layer of security, do a server-side check for password strength
const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/;

/**
 * Sign Up
 * Registers a user with Cognito, sending an email with a confirmation code.
 */
export const signUp = async (email, password, name, gender, birthdate) => {
  try {
    // Optional server-side password check (in addition to front-end)
    if (!strongPasswordRegex.test(password)) {
      throw new Error(
        "Password must have at least 8 characters, including uppercase, lowercase, a number, and a special character."
      );
    }

    // Make sure gender is a valid standard or custom attribute
    // (standard attribute: "gender"; custom attribute: "custom:gender")
    const command = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
        { Name: "gender", Value: gender },       // remove/change if not needed
        { Name: "birthdate", Value: birthdate },
      ],
    });

    await client.send(command);

    return "Sign-up successful! Please check your email for the confirmation code.";
  } catch (error) {
    console.error("Sign-Up Error:", JSON.stringify(error, null, 2));
    throw new Error(error.message || "Sign-up failed.");
  }
};

/**
 * Confirm Sign Up
 * Verifies the confirmation code emailed to the user.
 */
export const confirmSignUp = async (email, confirmationCode) => {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
    });

    await client.send(command);

    return "Confirmation successful! You can now log in.";
  } catch (error) {
    console.error("Confirmation Error:", JSON.stringify(error, null, 2));
    throw new Error(error.message || "Confirmation failed.");
  }
};

/**
 * Sign In
 * Authenticates the user using USER_PASSWORD_AUTH flow.
 */
export const signIn = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    // Basic validation on the client ID and email format
    if (!CLIENT_ID) {
      throw new Error("CLIENT_ID is missing or undefined. Check your .env file.");
    }
    const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!validateEmail(email)) {
      throw new Error("Invalid email format.");
    }

    // Initiate Auth
    const command = new InitiateAuthCommand({
      ClientId: CLIENT_ID,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await client.send(command);

    // Save tokens in localStorage (adjust as needed for your app)
    localStorage.setItem("email", email);
    localStorage.setItem("accessToken", response.AuthenticationResult.AccessToken);
    localStorage.setItem("isAuthenticated", "true");

    return "Sign-in successful!";
  } catch (error) {
    console.error("Sign-In Error:", JSON.stringify(error, null, 2));
    throw new Error(error.message || "Sign-in failed.");
  }
};

/**
 * Get Current User
 * Returns the email address stored in localStorage (if any).
 */
export const getCurrentUser = () => {
  return localStorage.getItem("email") || null;
};

/**
 * Sign Out
 * Clears localStorage and marks user as unauthenticated.
 */
export const signOut = () => {
  localStorage.clear();
  localStorage.setItem("isAuthenticated", "false");
};
