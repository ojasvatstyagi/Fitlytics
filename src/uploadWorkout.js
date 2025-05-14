import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./uploadWorkout.css";

// Default function for onWorkoutSave prop if not provided
const defaultOnWorkoutSave = () => {
  console.log("onWorkoutSave prop not provided to UploadWorkout component.");
};

const UploadWorkout = ({
  onWorkoutSave = defaultOnWorkoutSave,
  editingWorkout, // This prop will contain the workout object if we are editing
}) => {
  // State for workout-level details
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDate, setWorkoutDate] = useState("");

  // State for the list of exercises in the current workout
  const [exercises, setExercises] = useState([]);

  // State for the exercise currently being added or edited
  const [currentExercise, setCurrentExercise] = useState({
    muscleGroup: "",
    exercise: "",
    sets: "",
    reps: "",
    weight: "",
    weightType: "kg", // Default weight type
    isAssistance: false, // Boolean to mark if it's an assisted exercise
  });
  // State to keep track of the index of the exercise being edited (null if adding new)
  const [editIndex, setEditIndex] = useState(null);
  // State to manage loading status during form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Predefined lists for dropdowns
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

  const weightTypes = ["kg", "lbs", "machine_units", "bodyweight"]; // Added more common weight types

  // Memoized initial state for an empty exercise
  const initialCurrentExerciseState = useMemo(
    () => ({
      muscleGroup: "",
      exercise: "",
      sets: "",
      reps: "",
      weight: "",
      weightType: "kg",
      isAssistance: false,
    }),
    []
  );

  // Effect to load a persisted workout draft from local storage on component mount
  useEffect(() => {
    if (!editingWorkout) {
      // Only load from local storage if not in edit mode
      const storedWorkout = localStorage.getItem("currentWorkoutDraft");
      if (storedWorkout) {
        try {
          const parsedWorkout = JSON.parse(storedWorkout);
          setWorkoutName(parsedWorkout.workoutName || "");
          setWorkoutDate(parsedWorkout.workoutDate || "");
          setExercises(
            Array.isArray(parsedWorkout.exercises)
              ? parsedWorkout.exercises
              : []
          );
          setCurrentExercise(
            parsedWorkout.currentExercise || { ...initialCurrentExerciseState }
          );
          console.log(
            "Loaded workout draft from local storage:",
            parsedWorkout
          );
        } catch (error) {
          console.error(
            "Error parsing workout draft from local storage:",
            error
          );
          localStorage.removeItem("currentWorkoutDraft"); // Clear corrupted data
        }
      }
    }
  }, [editingWorkout, initialCurrentExerciseState]); // Added initialCurrentExerciseState to dependencies

  useEffect(() => {
    if (editingWorkout) {
      setWorkoutName(editingWorkout.workoutName || "Untitled Workout");
      setWorkoutDate(editingWorkout.workoutDate || ""); // Ensure date is in YYYY-MM-DD
      setExercises(
        Array.isArray(editingWorkout.exercises) ? editingWorkout.exercises : []
      );
      setCurrentExercise({ ...initialCurrentExerciseState }); // Reset current exercise form
      setEditIndex(null); // Ensure not in exercise edit mode
      localStorage.removeItem("currentWorkoutDraft"); // Clear any draft if we are editing a saved workout
    }
  }, [editingWorkout, initialCurrentExerciseState]); // Added initialCurrentExerciseState to dependencies

  // Effect to save current workout form state (draft) to local storage
  useEffect(() => {
    // Only save as draft if not actively editing a saved workout from props
    if (!editingWorkout) {
      const currentWorkoutData = {
        workoutName,
        workoutDate,
        exercises,
        currentExercise,
      };
      localStorage.setItem(
        "currentWorkoutDraft",
        JSON.stringify(currentWorkoutData)
      );
      // console.log("Saved workout draft to local storage:", currentWorkoutData);
    }
  }, [workoutName, workoutDate, exercises, currentExercise, editingWorkout]);

  // Resets the entire workout form and clears local storage draft
  const resetForm = useCallback(() => {
    setWorkoutName("");
    setWorkoutDate("");
    setExercises([]);
    setCurrentExercise({ ...initialCurrentExerciseState });
    setEditIndex(null);
    localStorage.removeItem("currentWorkoutDraft");
    // Note: `editingWorkout` prop is controlled by the parent.
    // If this reset is called after an edit, the parent should clear `editingWorkout`.
  }, [initialCurrentExerciseState]);

  // Handles input changes for the current exercise being added/edited
  const handleInputChange = (field, value) => {
    setCurrentExercise((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addOrUpdateExercise = () => {
    const {
      muscleGroup,
      exercise,
      sets,
      reps,
      weight,
      weightType,
    } = currentExercise;

    // Validate required fields
    if (
      !muscleGroup ||
      !exercise ||
      !sets ||
      !reps ||
      (weightType !== "bodyweight" && !weight)
    ) {
      toast.error(
        "Please fill out all required fields for the exercise (Muscle Group, Exercise, Sets, Reps, Weight unless bodyweight)."
      );
      return;
    }

    // Validate numeric inputs
    const numSets = parseFloat(sets);
    const numReps = parseFloat(reps);
    const numWeight = weightType !== "bodyweight" ? parseFloat(weight) : 0;

    if (isNaN(numSets) || numSets <= 0) {
      toast.error("Sets must be a positive number.");
      return;
    }
    if (isNaN(numReps) || numReps <= 0) {
      toast.error("Reps must be a positive number.");
      return;
    }
    if (weightType !== "bodyweight" && (isNaN(numWeight) || numWeight < 0)) {
      toast.error("Weight must be a non-negative number.");
      return;
    }

    const newExerciseData = {
      ...currentExercise,
      sets: numSets,
      reps: numReps,
      weight: numWeight,
    };

    if (editIndex !== null) {
      // If editing an existing exercise
      const updatedExercises = [...exercises];
      updatedExercises[editIndex] = newExerciseData;
      setExercises(updatedExercises);
      setEditIndex(null); // Exit edit mode for exercises
      toast.success("Exercise updated successfully!");
    } else {
      // If adding a new exercise
      setExercises([...exercises, newExerciseData]);
      toast.success("Exercise added successfully!");
    }

    // Reset current exercise form fields
    setCurrentExercise({
      ...initialCurrentExerciseState,
      muscleGroup: muscleGroup,
    }); // Keep muscle group for convenience
  };
  // Sets up an exercise for editing
  const startEditExercise = (index) => {
    setCurrentExercise(exercises[index]);
    setEditIndex(index);
  };

  // Deletes an exercise from the list
  const deleteExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
    toast.info("Exercise removed.");
    if (editIndex === index) {
      // If deleting the exercise currently being edited
      setCurrentExercise({ ...initialCurrentExerciseState });
      setEditIndex(null);
    }
  };

  // Handles the final submission of the entire workout
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Get userID (email) from localStorage - consider a more robust auth state management
    const userID = localStorage.getItem("email");
    if (!userID) {
      toast.error(
        "Authentication error: User ID not found. Please log in again."
      );
      setIsSubmitting(false);
      return;
    }

    if (!workoutDate) {
      toast.error("Please provide a workout date.");
      setIsSubmitting(false);
      return;
    }
    if (exercises.length === 0) {
      toast.error("Please add at least one exercise to the workout.");
      setIsSubmitting(false);
      return;
    }

    // Prepare workout data for the API
    const workoutData = {
      userID,
      // workoutID is included only if we are editing an existing workout
      ...(editingWorkout &&
        editingWorkout.workoutID && { workoutID: editingWorkout.workoutID }),
      workoutName: workoutName.trim() || `Workout on ${workoutDate}`, // Default name if empty
      workoutDate, // Should be in YYYY-MM-DD format
      exercises: exercises.map((ex) => ({
        muscleGroup: ex.muscleGroup,
        exercise: ex.exercise,
        sets: Number(ex.sets),
        reps: Number(ex.reps),
        // API expects negative weight for assisted exercises
        weight: ex.isAssistance
          ? -Math.abs(Number(ex.weight))
          : Math.abs(Number(ex.weight)),
        weightType: ex.weightType,
        isAssistance: ex.isAssistance,
      })),
    };

    // Determine API endpoint based on whether it's a new workout or an update
    const url = editingWorkout
      ? `https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/updateWorkout`
      : `https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/saveWorkout`;

    try {
      console.log(
        "Submitting workout data:",
        JSON.stringify(workoutData, null, 2)
      );
      const response = await axios.post(url, workoutData);
      console.log("API Response:", response.data);
      toast.success(
        editingWorkout
          ? "Workout updated successfully!"
          : "Workout saved successfully!"
      );
      onWorkoutSave(); // Callback to inform parent (e.g., HomePage to refresh workout list)
      resetForm(); // Clear the form and local storage draft
    } catch (error) {
      console.error("Error saving workout:", error.response || error);
      const apiErrorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "An unexpected error occurred.";
      toast.error(`Failed to save workout: ${apiErrorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="upload-workout-container">
      <h3 className="workout-title">
        {editingWorkout ? "EDIT WORKOUT DETAILS" : "LOG NEW WORKOUT"}
      </h3>

      <form
        onSubmit={handleSubmit}
        className="workout-form"
        aria-busy={isSubmitting}
      >
        {/* Workout Name & Date */}
        <div className="form-row">
          <div className="input-group">
            <label htmlFor="workoutName">WORKOUT NAME</label>
            <input
              id="workoutName"
              type="text"
              placeholder="e.g., Morning Push Day, Leg Power Session"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="input-group">
            <label htmlFor="workoutDate">WORKOUT DATE *</label>
            <input
              id="workoutDate"
              type="date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              required
              disabled={isSubmitting}
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
              <label htmlFor="muscleGroup">MUSCLE GROUP *</label>
              <select
                id="muscleGroup"
                value={currentExercise.muscleGroup}
                onChange={(e) =>
                  handleInputChange("muscleGroup", e.target.value)
                }
                disabled={isSubmitting}
                required
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
              <label htmlFor="exercise">EXERCISE *</label>
              <select
                id="exercise"
                value={currentExercise.exercise}
                onChange={(e) => handleInputChange("exercise", e.target.value)}
                disabled={!currentExercise.muscleGroup || isSubmitting}
                required
              >
                <option value="">SELECT EXERCISE</option>
                {currentExercise.muscleGroup &&
                  (exercisesList[currentExercise.muscleGroup] || []).map(
                    (ex) => (
                      <option key={ex} value={ex}>
                        {ex.toUpperCase()}
                      </option>
                    )
                  )}
              </select>
            </div>

            {/* Sets */}
            <div className="input-group">
              <label htmlFor="sets">SETS *</label>
              <input
                id="sets"
                type="number"
                placeholder="e.g., 3"
                value={currentExercise.sets}
                onChange={(e) => handleInputChange("sets", e.target.value)}
                disabled={isSubmitting}
                min="1"
                required
              />
            </div>

            {/* Reps */}
            <div className="input-group">
              <label htmlFor="reps">REPS *</label>
              <input
                id="reps"
                type="number"
                placeholder="e.g., 10"
                value={currentExercise.reps}
                onChange={(e) => handleInputChange("reps", e.target.value)}
                disabled={isSubmitting}
                min="1"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="weight">
                WEIGHT {currentExercise.weightType !== "bodyweight" && "*"}
              </label>
              <input
                id="weight"
                type="number"
                placeholder={
                  currentExercise.weightType === "bodyweight"
                    ? "N/A"
                    : "e.g., 50"
                }
                value={currentExercise.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                disabled={
                  currentExercise.weightType === "bodyweight" || isSubmitting
                }
                min="0"
                step="0.01" // Allow decimal weights
                required={currentExercise.weightType !== "bodyweight"}
              />
            </div>
            <div className="input-group">
              <label htmlFor="weightType">WEIGHT TYPE *</label>
              <select
                id="weightType"
                value={currentExercise.weightType}
                onChange={(e) =>
                  handleInputChange("weightType", e.target.value)
                }
                disabled={isSubmitting}
                required
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
              <label htmlFor="isAssistance">EXERCISE TYPE</label>
              <select
                id="isAssistance"
                value={currentExercise.isAssistance.toString()} // Bind to string value for select
                onChange={(e) =>
                  handleInputChange("isAssistance", e.target.value === "true")
                }
                disabled={isSubmitting}
              >
                <option value="false">REGULAR</option>
                <option value="true">ASSISTED</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className="action-btn add-exercise-btn" // Added specific class for targeting if needed
            onClick={addOrUpdateExercise}
            disabled={isSubmitting}
          >
            {editIndex !== null
              ? "UPDATE EXERCISE IN LIST"
              : "ADD EXERCISE TO LIST"}
          </button>
        </div>

        {/* Display Area for Added Exercises */}
        <div className="current-exercises">
          <h4>CURRENTLY ADDED EXERCISES ({exercises.length})</h4>
          {exercises.length > 0 ? (
            <ul className="exercise-list">
              {exercises.map((ex, index) => (
                <li key={index} className="exercise-item">
                  <div className="exercise-details">
                    <strong>{ex.exercise?.toUpperCase()}</strong>
                    <p>
                      {ex.sets} sets × {ex.reps} reps @{" "}
                      {ex.weightType === "bodyweight"
                        ? "BW"
                        : `${ex.weight} ${ex.weightType?.toUpperCase()}`}
                      <span
                        className={`exercise-type ${
                          ex.isAssistance ? "assisted" : "regular"
                        }`}
                      >
                        ({ex.isAssistance ? "ASSISTED" : "REGULAR"})
                      </span>
                    </p>
                    <small>MUSCLE GROUP: {ex.muscleGroup?.toUpperCase()}</small>
                  </div>
                  <div className="exercise-actions">
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => startEditExercise(index)}
                      disabled={isSubmitting}
                      aria-label={`Edit ${ex.exercise}`}
                    >
                      EDIT
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => deleteExercise(index)}
                      disabled={isSubmitting}
                      aria-label={`Delete ${ex.exercise}`}
                    >
                      DELETE
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-exercises">
              No exercises added to this workout yet. Use the form above to add
              some!
            </p>
          )}
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={isSubmitting || exercises.length === 0}
        >
          {isSubmitting
            ? editingWorkout
              ? "UPDATING..."
              : "SAVING..."
            : editingWorkout
            ? "UPDATE FULL WORKOUT"
            : "SAVE FULL WORKOUT"}
        </button>
      </form>
    </div>
  );
};

export default UploadWorkout;
