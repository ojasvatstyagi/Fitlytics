import React, { useState, useEffect } from "react";
import axios from "axios";

import UploadWorkout from "./uploadWorkout";
import GetWorkouts from "./getWorkouts";
import WorkoutAnalytics from "./workoutAnalytics";
import Chatbot from "./chatbot";

import "./HomePage.css";
import "./chatbot.css";

const HomePage = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState("uploadWorkout");
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    fetchAllWorkouts();
  }, [refreshTrigger]);

const fetchAllWorkouts = async () => {
  const email = localStorage.getItem("email"); // ✅ updated key
  if (!email) {
    console.error("No user email found in localStorage.");
    return;
  }

  try {
    const API_BASE = process.env.REACT_APP_API_BASE;
    const response = await axios.get(`${API_BASE}/GetPastWorkouts`, {
      params: { email },
    });
    if (Array.isArray(response.data)) {
      setWorkouts(response.data);
    } else {
      console.error("Invalid workout data format:", response.data);
    }
  } catch (error) {
    console.error("Error fetching workouts:", error);
  }
};

  const handleEditWorkout = (workout) => {
    setEditingWorkout(workout);
    setActiveTab("uploadWorkout");
  };

  const handleWorkoutSave = () => {
    setEditingWorkout(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="home-page-container">
      <header className="home-header" aria-label="Page header">
        <div className="logo-container">
          <h1 className="main-title">IRON TRACKER</h1>
          <div className="gym-line"></div>
        </div>
        <button
          onClick={onLogout}
          className="sign-out-btn"
          aria-label="Sign out"
        >
          SIGN OUT
        </button>
      </header>

      <nav className="tabs-nav" aria-label="Main navigation">
        <div className="tabs-container">
          <button
            className={`tab-btn ${
              activeTab === "uploadWorkout" ? "active" : ""
            }`}
            onClick={() => setActiveTab("uploadWorkout")}
          >
            <i className="icon-upload"></i> LOG WORKOUT
          </button>
          <button
            className={`tab-btn ${
              activeTab === "viewWorkouts" ? "active" : ""
            }`}
            onClick={() => setActiveTab("viewWorkouts")}
          >
            <i className="icon-list"></i> WORKOUT HISTORY
          </button>
          <button
            className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            <i className="icon-chart"></i> ANALYTICS
          </button>
        </div>
      </nav>

      <main className="tab-content">
        {activeTab === "uploadWorkout" && (
          <UploadWorkout
            onWorkoutSave={handleWorkoutSave}
            editingWorkout={editingWorkout}
          />
        )}
        {activeTab === "viewWorkouts" && (
          <GetWorkouts workouts={workouts} onEditWorkout={handleEditWorkout} />
        )}
        {activeTab === "analytics" && <WorkoutAnalytics workouts={workouts} />}
      </main>

      <aside className="chatbot-container" aria-label="Chatbot section">
        <Chatbot workouts={workouts} />
      </aside>
    </div>
  );
};

export default HomePage;
