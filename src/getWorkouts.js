import React, { useState } from "react";
import { toast } from "react-toastify";
import "./getWorkouts.css";
import axios from "axios";

const GetWorkouts = ({ workouts, onEditWorkout, onDeleteSuccess }) => {
  // We store only the expanded workout ID locally
  const [expandedWorkout, setExpandedWorkout] = useState(null);

  // Expand/Collapse a workout’s details
  const toggleExpandWorkout = (workoutID) => {
    setExpandedWorkout((prev) => (prev === workoutID ? null : workoutID));
  };

  // Optional: If you still want to delete workouts here, we can do it locally,
  // then call onDeleteSuccess() in the parent to re-fetch or remove from parent’s state.
  const handleDeleteWorkout = async (workoutID) => {
    const userID = localStorage.getItem("email");
    if (!userID) {
      toast.error("You are not authenticated. Please log in again.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this workout?")) return;

    try {
      console.log("Deleting workout with ID:", workoutID, "for user:", userID);
      await axios.delete(
        "https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/deleteWorkout",
        {
          params: { workoutID, userID },
        }
      );
      toast.success("Workout deleted successfully.");

      // Option 1: Call parent’s success callback so it can refetch or update its state
      if (typeof onDeleteSuccess === "function") {
        onDeleteSuccess();
      }
    } catch (error) {
      console.error("Error deleting workout:", error.response || error);
      toast.error("Failed to delete workout. Please try again.");
    }
  };

  // Sort workouts by date in descending order (most recent first)
  const sortedWorkouts = workouts
    ? [...workouts].sort((a, b) => new Date(b.workoutDate) - new Date(a.workoutDate))
    : [];

  return (
    <div className="main-container">
      {/* Section Heading */}
      <div className="section-divider">
        <h2 className="section-heading">Your Workouts</h2>
      </div>

      {/* Past Workouts */}
      <div className="workouts-container">
        {sortedWorkouts && sortedWorkouts.length > 0 ? (
          <ul className="workout-list">
            {sortedWorkouts.map((workout) => (
              <li key={workout.workoutID} className="workout-item">
                <div
                  className="workout-header"
                  onClick={() => toggleExpandWorkout(workout.workoutID)}
                >
                  <h4 className="workout-title">
                    {workout.workoutName || "Untitled Workout"} -{" "}
                    {workout.workoutDate
                      ? new Date(workout.workoutDate).toLocaleDateString()
                      : "Unknown Date"}
                  </h4>
                </div>
                {/* Expand workout details if this workout is expanded */}
                {expandedWorkout === workout.workoutID && (
                  <ul className="exercise-list">
                    {(workout.exercises || []).map((exercise, index) => (
                      <li key={index} className="exercise-item">
                        <strong>{exercise.exercise}</strong> - {exercise.sets}{" "}
                        sets of {exercise.reps} reps at {exercise.weight}{" "}
                        {exercise.weightType} (
                        {exercise.isAssistance ? "Assisted" : "Regular"})
                      </li>
                    ))}
                  </ul>
                )}
                <div className="workout-actions">
                  <button
                    className="edit-btn"
                    onClick={() => {
                      if (typeof onEditWorkout === "function") {
                        onEditWorkout(workout);
                      } else {
                        console.error("onEditWorkout is not a function");
                      }
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteWorkout(workout.workoutID)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-workouts">No workouts found.</p>
        )}
      </div>
    </div>
  );
};

export default GetWorkouts;
