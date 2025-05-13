import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./uploadWorkout.css";

const UploadWorkout = ({ onWorkoutSave = () => {}, editingWorkout }) => {
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDate, setWorkoutDate] = useState("");
  const [exercises, setExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState({
    muscleGroup: "",
    exercise: "",
    sets: "",
    reps: "",
    weight: "",
    weightType: "kg",
    isAssistance: false,
  });
  const [editIndex, setEditIndex] = useState(null);

  const muscleGroups = ["Chest", "Legs", "Back", "Shoulders", "Arms", "Abs"];
  const exercisesList = {
    Chest: [
      "Pushups",
      "Deficit Pushups",
      "Dips",
      "Dumbbell Bench Press",
      "Dumbbell Incline Press",
      "Barbell Bench Press",
      "Barbell Incline Press",
      "Chest Press Machine",
      "Chest Press",
      "Cable Crossovers",
      "Incline Cable Crossovers",
      "Decline Cable Crossovers",
      "Pec Deck",
    ],
    Legs: [
      "Barbell Squats",
      "Smith Machine Squats",
      "Hack Squat",
      "Leg Press",
      "Leg Extensions",
      "Deadlifts",
      "Seated Hamstring Curls",
      "Lying Hamstring Curl",
      "Smith Machine Goodmornings",
      "Romanian Deadlifts",
      "Bulgarian Split Squats",
      "Calf Raises",
      "Seated Calf Raises",
      "Tib Raises",
      "Glute Machine",
      "Hip Thrusts",
      "Abductor Machine",
      "Adductor Machine",
      "Dumbbell Lunges",
      "Sprinter Lunges Dumbbell",
      "Sprinter Lunges Smith Machine",
    ],
    Back: [
      "Pull Ups",
      "Assisted Pull Ups",
      "Chin Ups",
      "Assisted Chin-Ups",
      "Lat Pulldown",
      "Straight Arm Cable Pulldown",
      "Dumbbell Rows",
      "Barbell Rows",
      "Cable Rows",
      "T Bar Row",
      "High Row Machine",
      "Low Row Machine",
      "Back Extensions Bench",
      "Back Extensions Machine",
      "Dumbbell Shrugs",
      "Barbell Shrugs",
      "Trap Bar Shrugs",
      "Incline Trap Raise",
    ],
    Arms: [
      "Tricep Press Machine",
      "Cable Overhead Tricep Extensions",
      "Tricep Pulldown Rope",
      "Tricep Pulldown Rope Single-Arm",
      "Dumbbell Kickbacks",
      "Cable Kickbacks",
      "Skullcrushers",
      "Bicep Curls Dumbbell",
      "Bicep Curls Barbell",
      "Bicep Curls Cable",
      "Bicep Curls Cable Non-Machine",
      "Reverse Curls Cable Non-Machine",
      "Reverse Curls Cable",
      "Reverse Curls Dumbbell",
      "Reverse Curls Barbell",
      "Hammer Curls Dumbbell",
      "Preacher Curls",
      "Preacher Curls Dumbbell",
      "Preacher Curls Cable",
      "Reverse Preacher Curls",
      "Forearm Curls Pronated",
      "Forearm Curls Supinated",
      "Wrist Curls Supinated",
      "Wrist Curls Pronated",
    ],
    Shoulders: [
      "Shoulder Press Machine",
      "Shoulder Press Dumbbell",
      "Shoulder Press Barbell",
      "Lateral Raises",
      "Cable Lateral Raises",
      "Face Pulls",
      "Rotator Cuff Band",
      "External Rotation Horizontal",
      "External Rotation Vertical",
      "Rotator Cuff Cable",
      "Reverse Pec Deck Flys",
    ],
    Abs: [
      "Crunch Machine",
      "V-Crunch Machine",
      "Oblique Machine",
      "Hanging Leg Raises",
      "Elbow-Supported Hanging Leg Raises",
    ],
  };
  const weightTypes = ["kg", "machine"];

  useEffect(() => {
    // Load current workout from local storage on mount
    const storedWorkout = localStorage.getItem("currentWorkout");
    if (storedWorkout) {
      const parsedWorkout = JSON.parse(storedWorkout);
      setWorkoutName(parsedWorkout.workoutName || "");
      setWorkoutDate(parsedWorkout.workoutDate || "");
      setExercises(parsedWorkout.exercises || []);
      setCurrentExercise(
        parsedWorkout.currentExercise || {
          muscleGroup: "",
          exercise: "",
          sets: "",
          reps: "",
          weight: "",
          weightType: "kg",
          isAssistance: false,
        }
      );
      console.log("Loaded workout from local storage:", parsedWorkout);
    }
  }, []);

  useEffect(() => {
    if (editingWorkout) {
      setWorkoutName(editingWorkout.workoutName || "");
      setWorkoutDate(editingWorkout.workoutDate || "");
      setExercises(editingWorkout.exercises || []);
    }
  }, [editingWorkout]);

  // Save current workout data to local storage whenever it changes
  useEffect(() => {
    const currentWorkoutData = {
      workoutName,
      workoutDate,
      exercises,
      currentExercise,
    };
    localStorage.setItem("currentWorkout", JSON.stringify(currentWorkoutData));
    console.log("Saved workout to local storage:", currentWorkoutData);
  }, [workoutName, workoutDate, exercises, currentExercise]);

  const resetForm = () => {
    setWorkoutName("");
    setWorkoutDate("");
    setExercises([]);
    setCurrentExercise({
      muscleGroup: "",
      exercise: "",
      sets: "",
      reps: "",
      weight: "",
      weightType: "kg",
      isAssistance: false,
    });
    setEditIndex(null);
    localStorage.removeItem("currentWorkout"); // Clear the local storage when resetting the form
  };

  const handleInputChange = (field, value) => {
    setCurrentExercise({
      ...currentExercise,
      [field]: value,
    });
  };

  const addOrUpdateExercise = () => {
    const { muscleGroup, exercise, sets, reps, weight } = currentExercise;

    if (!muscleGroup || !exercise || !sets || !reps || !weight) {
      toast.error("Please fill out all fields for the exercise.");
      return;
    }

    const newExercise = { ...currentExercise };

    if (editIndex !== null) {
      const updatedExercises = [...exercises];
      updatedExercises[editIndex] = newExercise;
      setExercises(updatedExercises);
      setEditIndex(null);
      toast.success("Exercise updated successfully!");
    } else {
      setExercises([...exercises, newExercise]);
      toast.success("Exercise added successfully!");
    }

    setCurrentExercise({
      muscleGroup: "",
      exercise: "",
      sets: "",
      reps: "",
      weight: "",
      weightType: "kg",
      isAssistance: false,
    });
  };

  const editExercise = (index) => {
    setCurrentExercise(exercises[index]);
    setEditIndex(index);
  };

  const deleteExercise = (index) => {
    const updatedExercises = exercises.filter((_, i) => i !== index);
    setExercises(updatedExercises);
    toast.success("Exercise removed.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userID = localStorage.getItem("email");
    if (!userID) {
      toast.error("You are not authenticated. Please log in again.");
      return;
    }

    if (!workoutDate) {
      toast.error("Please provide a workout date.");
      return;
    }

    const workoutData = {
      userID,
      workoutID: editingWorkout?.workoutID || null,
      workoutName: workoutName || "Untitled Workout",
      workoutDate,
      exercises: exercises.map((exercise) => ({
        muscleGroup: exercise.muscleGroup,
        exercise: exercise.exercise,
        sets: Number(exercise.sets),
        reps: Number(exercise.reps),
        weight: exercise.isAssistance
          ? -Math.abs(Number(exercise.weight))
          : Math.abs(Number(exercise.weight)),
        weightType: exercise.weightType,
        isAssistance: exercise.isAssistance,
      })),
    };

    const url = editingWorkout
      ? `https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/updateWorkout`
      : `https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/saveWorkout`;

    try {
      console.log(
        "Submitting workout data:",
        JSON.stringify(workoutData, null, 2)
      );
      const response = await axios.post(url, workoutData);
      console.log("Workout saved successfully:", response.data);
      toast.success(
        editingWorkout
          ? "Workout updated successfully!"
          : "Workout saved successfully!"
      );
      onWorkoutSave();
      resetForm();
    } catch (error) {
      console.error("Error saving workout:", error.response || error);
      toast.error("Failed to save workout. Please try again.");
    }
  };

  return (
    <div className="upload-workout-container">
      <h3 className="workout-title">
        {editingWorkout ? "EDIT WORKOUT" : "LOG NEW WORKOUT"}
      </h3>

      <form onSubmit={handleSubmit} className="workout-form">
        {/* Workout Name & Date */}
        <div className="form-row">
          <div className="input-group">
            <label>WORKOUT NAME</label>
            <input
              type="text"
              placeholder="Optional"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>WORKOUT DATE *</label>
            <input
              type="date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Exercise Form */}
        <div className="exercise-form">
          <h4 className="exercise-title">
            {editIndex !== null ? "EDIT EXERCISE" : "ADD EXERCISE"}
          </h4>

          <div className="form-grid">
            {/* Muscle Group */}
            <div className="input-group">
              <label>MUSCLE GROUP</label>
              <select
                value={currentExercise.muscleGroup}
                onChange={(e) =>
                  handleInputChange("muscleGroup", e.target.value)
                }
              >
                <option value="">SELECT GROUP</option>
                {muscleGroups.map((group) => (
                  <option key={group} value={group}>
                    {group.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Exercise */}
            <div className="input-group">
              <label>EXERCISE</label>
              <select
                value={currentExercise.exercise}
                onChange={(e) => handleInputChange("exercise", e.target.value)}
                disabled={!currentExercise.muscleGroup}
              >
                <option value="">SELECT EXERCISE</option>
                {currentExercise.muscleGroup &&
                  exercisesList[currentExercise.muscleGroup].map((ex) => (
                    <option key={ex} value={ex}>
                      {ex.toUpperCase()}
                    </option>
                  ))}
              </select>
            </div>

            {/* Sets */}
            <div className="input-group">
              <label>SETS</label>
              <input
                type="number"
                placeholder="0"
                value={currentExercise.sets}
                onChange={(e) => handleInputChange("sets", e.target.value)}
              />
            </div>

            {/* Reps */}
            <div className="input-group">
              <label>REPS</label>
              <input
                type="number"
                placeholder="0"
                value={currentExercise.reps}
                onChange={(e) => handleInputChange("reps", e.target.value)}
              />
            </div>

            {/* Weight */}
            <div className="input-group">
              <label>WEIGHT</label>
              <input
                type="number"
                placeholder="0"
                value={currentExercise.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
              />
            </div>

            {/* Weight Type */}
            <div className="input-group">
              <label>WEIGHT TYPE</label>
              <select
                value={currentExercise.weightType}
                onChange={(e) =>
                  handleInputChange("weightType", e.target.value)
                }
              >
                {weightTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Assistance */}
            <div className="input-group">
              <label>EXERCISE TYPE</label>
              <select
                value={currentExercise.isAssistance}
                onChange={(e) =>
                  handleInputChange("isAssistance", e.target.value === "true")
                }
              >
                <option value="false">REGULAR</option>
                <option value="true">ASSISTED</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className="action-btn"
            onClick={addOrUpdateExercise}
          >
            {editIndex !== null ? "UPDATE EXERCISE" : "ADD EXERCISE"}
          </button>
        </div>

        {/* Current Exercises */}
        <div className="current-exercises">
          <h4>CURRENT EXERCISES</h4>
          {exercises.length > 0 ? (
            <ul className="exercise-list">
              {exercises.map((exercise, index) => (
                <li key={index} className="exercise-item">
                  <span className="exercise-details">
                    <strong>{exercise.exercise.toUpperCase()}</strong> -{" "}
                    {exercise.sets} SETS × {exercise.reps} REPS @{" "}
                    {exercise.weight} {exercise.weightType.toUpperCase()}
                    <span
                      className={`exercise-type ${
                        exercise.isAssistance ? "assisted" : "regular"
                      }`}
                    >
                      ({exercise.isAssistance ? "ASSISTED" : "REGULAR"})
                    </span>
                  </span>
                  <div className="exercise-actions">
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => editExercise(index)}
                    >
                      EDIT
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => deleteExercise(index)}
                    >
                      DELETE
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-exercises">No exercises added yet</p>
          )}
        </div>

        <button type="submit" className="submit-btn">
          {editingWorkout ? "UPDATE WORKOUT" : "SAVE WORKOUT"}
        </button>
      </form>
    </div>
  );
};

export default UploadWorkout;
