import React, { useState } from "react";
import { toast } from "react-toastify";
import "./getWorkouts.css";
import axios from "axios";

const GetWorkouts = ({
  workouts = [], // Default to empty array if undefined
  onEditWorkout,
  onDataChange, // Renamed from onDeleteSuccess, parent should pass a refresh function
  isLoading, // To indicate if workouts are currently being fetched
}) => {
  const [expandedWorkoutId, setExpandedWorkoutId] = useState(null); // Stores the ID of the expanded workout
  const [isDeleting, setIsDeleting] = useState(null); // Stores the ID of the workout being deleted

  // Toggles the expanded state of a workout
  const toggleExpandWorkout = (workoutID) => {
    setExpandedWorkoutId((prevId) => (prevId === workoutID ? null : workoutID));
  };

  // Handles the deletion of a workout
  const handleDeleteWorkout = async (workoutID) => {
    // Get userID (email) from localStorage - consider a more robust auth state management
    const userID = localStorage.getItem("email");
    if (!userID) {
      toast.error(
        "Authentication error: User ID not found. Please log in again."
      );
      return;
    }

    // Confirmation dialog before deleting
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this workout? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(workoutID); // Indicate deletion is in progress for this specific workout
    try {
      console.log(
        "Attempting to delete workout with ID:",
        workoutID,
        "for user:",
        userID
      );
      const API_BASE = process.env.REACT_APP_API_BASE;

      await axios.delete(`${API_BASE}/deleteWorkout`, {
        params: { workoutID, userID },
      });

      toast.success("Workout deleted successfully.");
      if (typeof onDataChange === "function") {
        onDataChange(); // Trigger data refresh in the parent component
      }
      if (expandedWorkoutId === workoutID) {
        setExpandedWorkoutId(null); // Collapse if the deleted workout was expanded
      }
    } catch (error) {
      console.error("Error deleting workout:", error.response || error);
      const apiErrorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "An unexpected error occurred.";
      toast.error(`Failed to delete workout: ${apiErrorMessage}`);
    } finally {
      setIsDeleting(null); // Reset deletion indicator
    }
  };

  // Sort workouts by date in descending order (most recent first)
  // Ensure workouts is an array before attempting to sort
  const sortedWorkouts = Array.isArray(workouts)
    ? [...workouts].sort(
        (a, b) => new Date(b.workoutDate) - new Date(a.workoutDate)
      )
    : [];

  if (isLoading) {
    return (
      <div className="loading-message">
        Loading your workouts... Please wait.
      </div>
    );
  }

  if (!sortedWorkouts.length) {
    return (
      <div className="main-container">
        <div className="section-divider">
          <h2 className="section-heading">Your Workout History</h2>
        </div>
        <p className="no-workouts">
          No workouts yet. Time to hit the gym and log your first session!
        </p>
      </div>
    );
  }

  return (
    <div className="main-container get-workouts-component">
      {" "}
      {/* Added component-specific class */}
      <div className="section-divider">
        <h2 className="section-heading">Your Workout History</h2>
      </div>
      <div className="workouts-container">
        <ul className="workout-list-ul">
          {" "}
          {/* Changed class for clarity */}
          {sortedWorkouts.map((workout) => {
            const isExpanded = expandedWorkoutId === workout.workoutID;
            return (
              <li key={workout.workoutID} className="workout-item-li">
                {" "}
                {/* Changed class for clarity */}
                <div
                  className="workout-header"
                  onClick={() => toggleExpandWorkout(workout.workoutID)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      toggleExpandWorkout(workout.workoutID);
                    }
                  }}
                  role="button" // Make it behave like a button
                  tabIndex={0} // Make it focusable
                  aria-expanded={isExpanded}
                  aria-controls={`workout-details-${workout.workoutID}`}
                >
                  <h4 className="workout-name-display">
                    {" "}
                    {/* Changed class */}
                    {workout.workoutName || "Untitled Workout"}
                  </h4>
                  <span className="workout-date-display">
                    {" "}
                    {/* Changed class */}
                    {workout.workoutDate
                      ? new Date(workout.workoutDate).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "Unknown Date"}
                  </span>
                  <span className="expand-indicator">
                    {isExpanded ? "▼" : "▶"}
                  </span>{" "}
                  {/* Visual indicator */}
                </div>
                {isExpanded && (
                  <div
                    id={`workout-details-${workout.workoutID}`}
                    className="workout-details-expanded"
                  >
                    {" "}
                    {/* Changed class */}
                    <h5>Exercises:</h5>
                    {Array.isArray(workout.exercises) &&
                    workout.exercises.length > 0 ? (
                      <ul className="exercise-list-ul">
                        {" "}
                        {/* Changed class */}
                        {workout.exercises.map((exercise, index) => (
                          <li key={index} className="exercise-item-li">
                            {" "}
                            {/* Changed class */}
                            <strong>{exercise.exercise}</strong> (
                            {exercise.muscleGroup})
                            <br />
                            {exercise.sets} sets × {exercise.reps} reps @{" "}
                            {exercise.weightType === "bodyweight"
                              ? "Bodyweight"
                              : `${Math.abs(exercise.weight)} ${
                                  exercise.weightType
                                }`}
                            <span
                              className={`exercise-type-tag ${
                                exercise.isAssistance ? "assisted" : "regular"
                              }`}
                            >
                              ({exercise.isAssistance ? "Assisted" : "Regular"})
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-exercises-in-workout">
                        No specific exercises logged for this workout.
                      </p>
                    )}
                    <div className="workout-actions">
                      <button
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent header click when button is clicked
                          if (typeof onEditWorkout === "function") {
                            onEditWorkout(workout);
                          } else {
                            console.error(
                              "onEditWorkout prop is not a function"
                            );
                            toast.error("Edit function not available.");
                          }
                        }}
                        disabled={isDeleting === workout.workoutID}
                        aria-label={`Edit workout from ${new Date(
                          workout.workoutDate
                        ).toLocaleDateString()}`}
                      >
                        Edit Workout
                      </button>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent header click
                          handleDeleteWorkout(workout.workoutID);
                        }}
                        disabled={isDeleting === workout.workoutID}
                        aria-label={`Delete workout from ${new Date(
                          workout.workoutDate
                        ).toLocaleDateString()}`}
                      >
                        {isDeleting === workout.workoutID
                          ? "Deleting..."
                          : "Delete Workout"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default GetWorkouts;
