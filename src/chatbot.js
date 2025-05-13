import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./chatbot.css";

function Chatbot({ workouts = [] }) {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ref to help auto-scroll the chat to the bottom
  const chatBodyRef = useRef(null);

  // Toggles the chat panel
  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  // Handles changes in the user's input text
  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  // Auto-scroll to bottom when chatHistory or loading changes
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  // Helper to transform workouts so we only send exercise name, sets, reps, weight, isAssistance
  const transformWorkouts = (rawWorkouts) => {
    return rawWorkouts.map((workout) => ({
      workoutName: workout.workoutName,
      workoutDate: workout.workoutDate,
      exercises: (workout.exercises || []).map((ex) => ({
        exercise: ex.exercise,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        isAssistance: ex.isAssistance,
      })),
    }));
  };

  // Remove unwanted markdown characters from the bot's response
  const sanitizeMessage = (text) => {
    return text.replace(/[#*]/g, "");
  };

  // Send the user's message (plus transformed workouts) to the chatbot
  const handleSend = async () => {
    // Prevent sending empty messages
    if (!userInput.trim()) return;

    // Add user’s message to the chat
    setChatHistory((prev) => [...prev, { sender: "user", message: userInput }]);
    setLoading(true);

    try {
      const email = localStorage.getItem("email");
      if (!email) {
        // If no email, show error in chat
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "bot",
            message: "You are not authenticated. Please log in again.",
          },
        ]);
        setLoading(false);
        setUserInput("");
        return;
      }

      // Transform workouts to minimal fields
      const minimalWorkouts = transformWorkouts(workouts);

      // Log exactly what we're sending to the model (optional)
      

      // Post user input + minimal workoutHistory to your API
      const response = await axios.post(
        process.env.REACT_APP_CHATBOT_API_URL,
        {
          userInput,
          workoutHistory: minimalWorkouts,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Use sanitizeMessage on the bot's response
      const sanitized = sanitizeMessage(response.data.response);

      // Append the bot's response to chat
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", message: sanitized },
      ]);
    } catch (error) {
      console.error("Error communicating with chatbot:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "bot",
          message:
            "An error occurred while processing your request. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
      setUserInput("");
    }
  };

  return (
    <div className={`chat-widget ${isOpen ? "chat-widget-expanded" : ""}`}>
      {isOpen ? (
        <div className="chat-widget-open">
          <div className="chat-header" onClick={toggleChat}>
            <span className="chat-title">Chat with us</span>
            <button className="close-btn">&times;</button>
          </div>
          <div className="chat-body" ref={chatBodyRef}>
            <div className="chat-history">
              {chatHistory.map((chat, index) => (
                <div key={index} className={`chat-bubble ${chat.sender}`}>
                  <strong>{chat.sender === "user" ? "You" : "Bot"}: </strong>
                  {chat.message}
                </div>
              ))}
              {loading && (
                <div className="chat-bubble bot">
                  <strong>Bot: </strong>Bot is typing...
                </div>
              )}
            </div>
            <div className="chat-input-container">
              <input
                type="text"
                value={userInput}
                onChange={handleInputChange}
                placeholder="Ask me anything about workouts!"
                className="chat-input"
              />
              <button onClick={handleSend} className="chat-send-btn">
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="chat-widget-closed" onClick={toggleChat}>
          <div className="chat-header">
            <span className="chat-title">Chat with us</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
