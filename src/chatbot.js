import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./chatbot.css"; // Ensure CSS is in the same folder or path is correct
import { toast } from "react-toastify"; // For user notifications

const formatAIText = (text) => {
  if (!text) return "";
  let formatted = text;
  // Headings (e.g., ### Title)
  formatted = formatted.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  // Bold text (e.g., **Bold**)
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // List items (e.g., - Item)
  formatted = formatted.replace(/^- (.*)$/gm, "<li>$1</li>");
  // Wrap consecutive <li> into <ul>
  formatted = formatted.replace(
    /(<li>.*?<\/li>)+/gs,
    (match) => `<ul>${match}</ul>`
  );
  // Paragraphs (simple line breaks to <br />)
  formatted = formatted.replace(/\n/g, "<br />");
  // Clean up <br /> that might be incorrectly placed around lists by the simple \n replacement
  formatted = formatted.replace(/<li><br \/>/g, "<li>");
  formatted = formatted.replace(/<br \/>\s*<ul>/g, "<ul>");
  formatted = formatted.replace(/<\/ul><br \/>/g, "</ul>");
  return formatted;
};

function Chatbot({ workouts = [], userEmail: propUserEmail }) {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false); // Chat widget visibility
  const [isLoading, setIsLoading] = useState(false); // For bot's response loading

  const chatBodyRef = useRef(null); // Ref for scrolling chat to bottom
  const inputRef = useRef(null); // Ref for focusing input when chat opens

  // Effect for initial welcome message when chat opens and is empty
  useEffect(() => {
    if (isOpen && chatHistory.length === 0) {
      setChatHistory([
        {
          sender: "bot",
          message:
            "Hello! I'm your Iron Assistant. How can I help with your fitness journey today?",
        },
      ]);
    }
  }, [isOpen, chatHistory.length]); // Rerun when isOpen changes, chatHistory.length is implicitly handled

  // Effect to auto-scroll chat to the latest message
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  // Toggles the chat panel's open/closed state
  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  // Handles changes in the user's input field
  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  // Transforms workout data to a minimal format for the API
  const transformWorkoutsForAI = (rawWorkouts) => {
    if (!Array.isArray(rawWorkouts)) return [];
    return rawWorkouts.map((workout) => ({
      workoutName: workout.workoutName,
      workoutDate: workout.workoutDate,
      exercises: (workout.exercises || []).map((ex) => ({
        muscleGroup: ex.muscleGroup,
        exercise: ex.exercise,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        weightType: ex.weightType,
        isAssistance: ex.isAssistance,
      })),
    }));
  };

  // Handles sending the user's message to the chatbot API
  const handleSend = async () => {
    if (!userInput.trim()) return; // Prevent sending empty messages

    const currentUserEmail = propUserEmail || localStorage.getItem("email");

    if (!currentUserEmail) {
      toast.error("User email not found. Please log in.");
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "bot",
          message: "Error: Could not identify user. Please log in again.",
        },
      ]);
      return;
    }
    const newUserMessage = { sender: "user", message: userInput };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setUserInput(""); // Clear input field immediately
    setIsLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_CHATBOT_API_URL;
      if (!apiUrl) {
        console.error(
          "Chatbot API URL (REACT_APP_CHATBOT_API_URL) is not configured."
        );
        throw new Error("Chatbot service is currently unavailable.");
      }

      const minimalWorkouts = transformWorkoutsForAI(workouts);

      const response = await axios.post(
        apiUrl,
        {
          userInput: userInput,
          workoutHistory: minimalWorkouts, // Send workout history for context
          // userId: currentUserEmail, // Optionally send user email if API requires
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const botResponse =
        response.data?.response ||
        response.data?.message ||
        "Sorry, I couldn't process that.";
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", message: botResponse }, // Bot's raw response, will be formatted by dangerouslySetInnerHTML
      ]);
    } catch (error) {
      console.error(
        "Error communicating with chatbot:",
        error.response?.data || error.message || error
      );
      const errorMessage =
        error.message === "Chatbot service is currently unavailable."
          ? error.message
          : "Sorry, I encountered an error. Please try again later.";
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", message: errorMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Allow sending message with Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent newline in input
      handleSend();
    }
  };

  return (
    <div
      className={`chat-widget ${isOpen ? "chat-widget-expanded" : ""}`}
      role="dialog"
      aria-modal={isOpen}
      aria-labelledby="chat-title-main"
    >
      {isOpen ? (
        <div className="chat-content-wrapper">
          <div className="chat-header">
            <span id="chat-title-main" className="chat-title-text">
              Iron Assistant
            </span>
            <button
              className="chat-close-btn"
              onClick={toggleChat}
              aria-label="Close chat"
            >
              &times;
            </button>
          </div>
          <div className="chat-body" ref={chatBodyRef} aria-live="polite">
            {chatHistory.map((chat, index) => (
              <div key={index} className={`chat-bubble ${chat.sender}`}>
                {/* Apply formatAIText only to bot messages */}
                {chat.sender === "bot" ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatAIText(chat.message),
                    }}
                  />
                ) : (
                  chat.message
                )}
              </div>
            ))}
            {isLoading && (
              <div className="chat-bubble bot">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span> {/* Simple CSS typing indicator */}
                </div>
              </div>
            )}
          </div>
          <div className="chat-input-container">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your workouts..."
              className="chat-input"
              aria-label="Chat message input"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              className="chat-send-btn"
              disabled={isLoading || !userInput.trim()}
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <div
          className="chat-header chat-header-closed"
          onClick={toggleChat}
          role="button"
          tabIndex={0}
          aria-expanded="false"
          aria-label="Open chat with Iron Assistant"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") toggleChat();
          }}
        >
          <span id="chat-title-main" className="chat-title-text">
            Chat with Iron Assistant
          </span>
          {/* Optional: Add an icon for closed state like a chat bubble icon */}
          <svg
            className="chat-icon-closed"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"></path>
          </svg>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
