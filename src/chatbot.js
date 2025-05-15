// Gemini-integrated chatbot with workout history analysis

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./chatbot.css";
import { toast } from "react-toastify";

const formatAIText = (text) => {
  if (!text) return "";
  let formatted = text;
  formatted = formatted.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/^- (.*)$/gm, "<li>$1</li>");
  formatted = formatted.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);
  formatted = formatted.replace(/\n/g, "<br />");
  formatted = formatted.replace(/<li><br \/>/g, "<li>");
  formatted = formatted.replace(/<br \/>\s*<ul>/g, "<ul>");
  formatted = formatted.replace(/<\/ul><br \/>/g, "</ul>");
  return formatted;
};

function Chatbot({ workouts = [], userEmail: propUserEmail }) {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);

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
  }, [isOpen, chatHistory.length]);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

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

  const handleSend = async () => {
    if (!userInput.trim()) return;

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
    setUserInput("");
    setIsLoading(true);

    try {
      const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      const minimalWorkouts = transformWorkoutsForAI(workouts);

      const geminiPrompt = `User's Query: ${userInput}\n\nWorkout History (summarized):\n${JSON.stringify(minimalWorkouts)}`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
  {
    contents: [
      {
        parts: [
          {
            text: geminiPrompt,
          },
        ],
      },
    ],
  },
  {
    headers: {
      "Content-Type": "application/json",
    },
  }
);

      const botReply =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't understand that.";

      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", message: botReply },
      ]);
    } catch (error) {
      console.error("Gemini chatbot error:", error);
      toast.error("Failed to contact AI assistant.");
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "bot",
          message: "Sorry, something went wrong. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
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
                  <span></span>
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
