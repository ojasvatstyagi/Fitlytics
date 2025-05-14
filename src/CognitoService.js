import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  GetUserCommand, // Added for fetching user attributes if needed
  GlobalSignOutCommand, // For more robust sign out
} from "@aws-sdk/client-cognito-identity-provider";

// Initialize Cognito client (adjust region if needed)
const cognitoClient = new CognitoIdentityProviderClient({
  region: "us-east-1",
});

// This should match the App Client ID you configured in AWS Cognito
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;

// Password strength regex (primarily for client-side feedback; Cognito enforces its own policy)
const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#^()._{}[\]:;<>,~`+=|\\-]).{8,}$/;

/**
 * Validates the Cognito Client ID configuration.
 * @throws {Error} If CLIENT_ID is not configured.
 */
const ensureClientIdConfigured = () => {
  if (!CLIENT_ID) {
    console.error(
      "Cognito CLIENT_ID is missing. Check your .env file for REACT_APP_COGNITO_CLIENT_ID."
    );
    throw new Error("Authentication service is not configured properly.");
  }
};

/**
 * Handles Cognito errors and returns a user-friendly message.
 * @param {Error} error - The error object from Cognito.
 * @param {string} context - The operation context (e.g., "Sign-Up", "Sign-In").
 * @returns {Error} A new error with a user-friendly message.
 */
const handleCognitoError = (error, context) => {
  console.error(`${context} Error:`, error); // Keep detailed log for developers
  let message =
    error.message ||
    `An unexpected error occurred during ${context.toLowerCase()}.`;

  // Customize messages for common Cognito errors
  // Note: error.name might be more reliable than parsing error.message for specific exceptions
  if (error.name === "UserNotFoundException") {
    message =
      "No account found with that email. Please check the email or sign up.";
  } else if (error.name === "NotAuthorizedException") {
    message = "Incorrect email or password. Please try again.";
  } else if (error.name === "UsernameExistsException") {
    message =
      "An account with this email already exists. Please sign in or use a different email.";
  } else if (error.name === "InvalidPasswordException") {
    message =
      "Password does not meet the requirements. It needs an uppercase, lowercase, number, and special character, and be at least 8 characters long.";
  } else if (error.name === "CodeMismatchException") {
    message = "Invalid confirmation code. Please check the code and try again.";
  } else if (error.name === "ExpiredCodeException") {
    message = "The confirmation code has expired. Please request a new one.";
  } else if (error.message && error.message.includes("User is not confirmed")) {
    message =
      "Your account is not confirmed. Please check your email for a confirmation code or request a new one.";
  }
  // Add more specific error handling as needed

  throw new Error(message);
};

/**
 * Signs up a new user with AWS Cognito.
 * @param {string} email - User's email address.
 * @param {string} password - User's chosen password.
 * @param {string} name - User's full name.
 * @param {string} gender - User's gender.
 * @param {string} birthdate - User's birthdate (YYYY-MM-DD).
 * @returns {Promise<string>} Success message.
 * @throws {Error} If sign-up fails.
 */
export const signUp = async (email, password, name, gender, birthdate) => {
  ensureClientIdConfigured();
  if (!strongPasswordRegex.test(password)) {
    throw new Error(
      "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character."
    );
  }
  // Make sure gender is a valid standard or custom attribute
  // (standard attribute: "gender"; custom attribute: "custom:gender")
  const params = {
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "name", Value: name },
      { Name: "gender", Value: gender }, // Standard attribute
      { Name: "birthdate", Value: birthdate }, // Standard attribute (YYYY-MM-DD format)
    ],
  };

  try {
    const command = new SignUpCommand(params);
    await cognitoClient.send(command);
    // Store pending email for confirmation step if needed by UI, or handle in component state
    localStorage.setItem("pendingConfirmationEmail", email);
    return "Sign-up successful! Please check your email for the confirmation code.";
  } catch (error) {
    return handleCognitoError(error, "Sign-Up");
  }
};

/**
 * Confirms a user's sign-up with a confirmation code.
 * @param {string} email - User's email address.
 * @param {string} confirmationCode - The code sent to the user's email.
 * @returns {Promise<string>} Success message.
 * @throws {Error} If confirmation fails.
 */
export const confirmSignUp = async (email, confirmationCode) => {
  ensureClientIdConfigured();
  const params = {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: confirmationCode,
  };

  try {
    const command = new ConfirmSignUpCommand(params);
    await cognitoClient.send(command);
    localStorage.removeItem("pendingConfirmationEmail"); // Clean up
    return "Email confirmed successfully! You can now sign in.";
  } catch (error) {
    return handleCognitoError(error, "Confirmation");
  }
};

/**
 * Signs in a user using email and password.
 * Stores authentication tokens in localStorage.
 * @param {string} email - User's email address.
 * @param {string} password - User's password.
 * @returns {Promise<object>} Object containing tokens and user information.
 * @throws {Error} If sign-in fails.
 */
export const signIn = async (email, password) => {
  ensureClientIdConfigured();
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }
  // Basic email format validation (Cognito will also validate)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email format.");
  }

  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  };

  try {
    const command = new InitiateAuthCommand(params);
    const response = await cognitoClient.send(command);

    if (response.AuthenticationResult) {
      const {
        AccessToken,
        IdToken,
        RefreshToken,
      } = response.AuthenticationResult;
      // Storing tokens in localStorage is common but be aware of XSS risks.
      // For web apps, consider server-side sessions or HttpOnly cookies if possible.
      localStorage.setItem("accessToken", AccessToken);
      localStorage.setItem("idToken", IdToken); // ID token contains user attributes
      if (RefreshToken) {
        localStorage.setItem("refreshToken", RefreshToken);
      }
      localStorage.setItem("userEmail", email); // Store email for easy access
      localStorage.setItem("isAuthenticated", "true");

      return {
        message: "Sign-in successful!",
        accessToken: AccessToken,
        idToken: IdToken,
        email: email,
      };
    } else {
      // Handle cases like MFA required, new password required, etc.
      // response.ChallengeName will indicate the next step.
      // This basic example doesn't handle challenges.
      throw new Error(
        response.ChallengeName
          ? `Authentication challenge received: ${response.ChallengeName}`
          : "Sign-in failed to return tokens."
      );
    }
  } catch (error) {
    return handleCognitoError(error, "Sign-In");
  }
};
/**
 * Fetches attributes for the currently authenticated user.
 * Requires an access token.
 * @returns {Promise<Object|null>} User attributes object or null if not authenticated.
 */
export const fetchUserAttributes = async () => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    // console.log("No access token found for fetching user attributes.");
    return null;
  }

  const params = {
    AccessToken: accessToken,
  };

  try {
    const command = new GetUserCommand(params);
    const response = await cognitoClient.send(command);
    // response.UserAttributes is an array of { Name, Value }
    const attributes = {};
    response.UserAttributes.forEach((attr) => {
      attributes[attr.Name] = attr.Value;
    });
    return attributes; // Includes 'sub', 'email_verified', 'email', 'name', etc.
  } catch (error) {
    console.error("Error fetching user attributes:", error);
    // Could be due to expired token, etc.
    // Optionally, try to refresh token here or sign out user.
    if (
      error.name === "NotAuthorizedException" ||
      error.name === "TokenValidationException"
    ) {
      // signOut(); // Force sign out if token is invalid
    }
    return null;
  }
};

/**
 * Fetches the current user's details using the access token.
 * @returns {Promise<Object|null>} User details or null if not authenticated.
 */
export const getCurrentUser = async () => {
  const userAttributes = await fetchUserAttributes();
  if (!userAttributes) {
    return null;
  }
  return {
    email: userAttributes.email,
    name: userAttributes.name,
    gender: userAttributes.gender,
    birthdate: userAttributes.birthdate,
  };
};

/**
 * Gets the current user's email from localStorage.
 * For a more reliable check of authentication status, verify the token or fetch attributes.
 * @returns {string|null} User's email or null if not found.
 */
export const getCurrentUserEmail = () => {
  return localStorage.getItem("userEmail") || null;
};

/**
 * Checks if the user is currently authenticated based on localStorage.
 * For a more reliable check, verify the token validity with Cognito.
 * @returns {boolean} True if authenticated, false otherwise.
 */
export const isAuthenticated = () => {
  const authStatus = localStorage.getItem("isAuthenticated");
  // Additionally, you might want to check if tokens exist and are not expired.
  // For simplicity, this just checks the flag.
  return authStatus === "true" && !!localStorage.getItem("accessToken");
};

/**
 * Signs out the user.
 * Clears authentication-related items from localStorage and calls GlobalSignOut.
 * @returns {Promise<void>}
 */
export const signOut = async () => {
  ensureClientIdConfigured(); // Ensure CLIENT_ID is available for GlobalSignOut
  const accessToken = localStorage.getItem("accessToken");

  // Attempt to sign out from Cognito globally if access token is available
  if (accessToken) {
    const params = {
      AccessToken: accessToken,
    };
    try {
      const command = new GlobalSignOutCommand(params);
      await cognitoClient.send(command);
      console.log("Successfully signed out from Cognito.");
    } catch (error) {
      console.error("Error during Cognito GlobalSignOut:", error);
      // Continue with local sign out even if global sign out fails
    }
  }

  // Clear specific authentication items from localStorage
  localStorage.removeItem("accessToken");
  localStorage.removeItem("idToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("pendingConfirmationEmail"); // Clean up this if it exists
  // Avoid localStorage.clear() if you store other non-auth related app data.

  // For safety, you can still set isAuthenticated to false
  localStorage.setItem("isAuthenticated", "false");

  // Optionally, redirect to login page or update app state here
  // window.location.href = '/login'; // Example redirect
};
