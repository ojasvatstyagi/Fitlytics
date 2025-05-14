import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // Import Filler for area under line
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./WorkoutAnalytics.css"; // Assuming CSS is in the same folder

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler // Register Filler
);

// Helper to format AI's markdown-like text into basic HTML
const formatAIText = (text) => {
  if (!text) return "";
  let formatted = text;
  // Headings (e.g., ### Title)
  formatted = formatted.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  // Bold text (e.g., **Bold**)
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // List items (e.g., - Item) - ensure it handles nested lists if AI generates them
  // This simple regex will wrap consecutive <li> into one <ul>
  formatted = formatted.replace(/^- (.*)$/gm, "<li>$1</li>");
  formatted = formatted.replace(
    /(<li>.*?<\/li>)+/gs,
    (match) => `<ul>${match}</ul>`
  );
  // Paragraphs (simple line breaks, can be enhanced)
  formatted = formatted.replace(/\n/g, "<br />");
  // Remove <br /> inside <ul> or <ol> if it's directly after <li>
  formatted = formatted.replace(/<li><br \/>/g, "<li>");
  formatted = formatted.replace(/<br \/>\s*<ul>/g, "<ul>");
  formatted = formatted.replace(/<\/ul><br \/>/g, "</ul>");

  return formatted;
};

// Reusable chart sub-component for exercise progression
const ProgressionChart = ({ progressionData, exerciseName }) => {
  // Sort by date (oldest to newest)
  const sortedProgression = useMemo(
    () =>
      [...(progressionData || [])].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      ),
    [progressionData]
  );

  const labels = sortedProgression.map((entry) =>
    new Date(entry.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  );
  const totalVolumeData = sortedProgression.map((entry) =>
    entry.totalVolume.toFixed(2)
  );
  const avgVolumePerSetData = sortedProgression.map((entry) =>
    entry.avgVolumePerSet.toFixed(2)
  );
  const maxWeightData = sortedProgression.map((entry) =>
    Math.abs(entry.maxWeight).toFixed(2)
  ); // Use absolute for chart

  // Theme colors (ideally from CSS variables, but hardcoded for simplicity here)
  const textColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--text-primary")
      .trim() || "#FFFFFF";
  const borderColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--border-color")
      .trim() || "#333333";
  const accentColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent-color")
      .trim() || "#FF4D00";
  const blueColor = "#007bff"; // Example color
  const greenColor = "#28a745"; // Example color

  const data = {
    labels,
    datasets: [
      {
        label: "Total Volume (kg/lbs)", // Make unit dynamic if possible
        data: totalVolumeData,
        yAxisID: "yVolume",
        borderColor: blueColor,
        backgroundColor: "rgba(0, 123, 255, 0.1)", // Lighter fill
        tension: 0.3,
        fill: true,
      },
      {
        label: "Avg Volume/Set (kg/lbs)",
        data: avgVolumePerSetData,
        yAxisID: "yVolume",
        borderColor: greenColor,
        backgroundColor: "rgba(40, 167, 69, 0.1)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Max Weight Lifted (kg/lbs)",
        data: maxWeightData,
        yAxisID: "yWeight",
        borderColor: accentColor, // Use accent color from theme
        backgroundColor: "rgba(255, 77, 0, 0.1)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        ticks: { color: textColor },
        grid: { color: borderColor },
      },
      yVolume: {
        type: "linear",
        display: true,
        position: "left",
        title: { display: true, text: "Volume (kg/lbs)", color: textColor },
        ticks: { color: textColor },
        grid: { color: borderColor },
      },
      yWeight: {
        type: "linear",
        display: true,
        position: "right",
        title: { display: true, text: "Weight (kg/lbs)", color: textColor },
        ticks: { color: textColor },
        grid: { drawOnChartArea: false, color: borderColor }, // Avoid grid overlap
      },
    },
    plugins: {
      legend: { position: "top", labels: { color: textColor } },
      title: {
        display: true,
        text: `Progression for ${exerciseName}`,
        color: textColor,
        font: { size: 16 },
      },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        footerColor: "#fff",
        padding: 10,
        cornerRadius: 6,
      },
    },
  };

  return (
    <div
      className="chart-container"
      style={{ height: "300px", marginTop: "15px" }}
    >
      {" "}
      {/* Ensure container has height */}
      <Line data={data} options={options} />
    </div>
  );
};

const WorkoutAnalytics = ({ workouts = [], isLoading: isLoadingWorkouts }) => {
  const [analytics, setAnalytics] = useState({
    muscleGroupAnalytics: {},
    workoutFrequency: "",
  });
  const [expandedExercises, setExpandedExercises] = useState({}); // Tracks expanded state of exercise cards
  const [aiInsights, setAiInsights] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Compute analytics when workouts data changes
  useEffect(() => {
    if (Array.isArray(workouts) && workouts.length > 0) {
      computeAnalytics(workouts);
    } else {
      // Reset analytics if workouts are empty or undefined
      setAnalytics({ muscleGroupAnalytics: {}, workoutFrequency: "" });
      setAiInsights(""); // Clear AI insights too
    }
  }, [workouts]);

  const computeAnalytics = (currentWorkouts) => {
    const overallAnalytics = {};
    const workoutDatesSet = new Set();

    // Define exercises to be grouped (e.g., different pull-up variations)
    const pullChinExercises = [
      "Pull Ups",
      "Assisted Pull Ups",
      "Chin Ups",
      "Assisted Chin-Ups",
    ];

    const sortedWorkouts = [...currentWorkouts].sort(
      (a, b) => new Date(a.workoutDate) - new Date(b.workoutDate) // Oldest to newest for progression
    );

    sortedWorkouts.forEach((workout) => {
      if (!workout || !Array.isArray(workout.exercises)) return; // Skip malformed workouts
      workoutDatesSet.add(workout.workoutDate);

      const exercisesInWorkoutAggregated = {}; // Aggregate per exercise within this single workout

      workout.exercises.forEach((exercise) => {
        if (!exercise || !exercise.muscleGroup || !exercise.exercise) return; // Skip malformed exercises

        let baseExerciseName = exercise.exercise;
        let effectiveMuscleGroup = exercise.muscleGroup;

        // Group similar exercises (e.g., all pull-up types)
        if (
          effectiveMuscleGroup === "Back" &&
          pullChinExercises.includes(exercise.exercise)
        ) {
          baseExerciseName = "Pull Up / Chin-Up Variations";
        }
        // Add more grouping rules if needed

        const exerciseKey = `${effectiveMuscleGroup}-${baseExerciseName}`;

        if (!exercisesInWorkoutAggregated[exerciseKey]) {
          exercisesInWorkoutAggregated[exerciseKey] = {
            totalVolume: 0,
            totalSets: 0,
            maxWeight: Number.NEGATIVE_INFINITY, // Use negative infinity for proper max calculation
            // Store muscle group and exercise name for later reconstruction
            muscleGroup: effectiveMuscleGroup,
            exerciseName: baseExerciseName,
          };
        }

        const weightForVolume =
          exercise.weightType === "bodyweight" ? 0 : Math.abs(exercise.weight); // Use 0 for BW volume if not tracked by weight
        const volume =
          (Number(exercise.sets) || 0) *
          (Number(exercise.reps) || 0) *
          (weightForVolume || 0);

        exercisesInWorkoutAggregated[exerciseKey].totalVolume += volume;
        exercisesInWorkoutAggregated[exerciseKey].totalSets +=
          Number(exercise.sets) || 0;
        // Max weight should consider the actual weight lifted, handling assisted as positive for comparison
        exercisesInWorkoutAggregated[exerciseKey].maxWeight = Math.max(
          exercisesInWorkoutAggregated[exerciseKey].maxWeight,
          Math.abs(exercise.weight) // Compare absolute weights
        );
      });

      // Merge this workout's aggregated data into overall analytics
      Object.values(exercisesInWorkoutAggregated).forEach((aggData) => {
        const {
          muscleGroup,
          exerciseName,
          totalVolume,
          totalSets,
          maxWeight,
        } = aggData;

        if (!overallAnalytics[muscleGroup]) {
          overallAnalytics[muscleGroup] = {};
        }
        if (!overallAnalytics[muscleGroup][exerciseName]) {
          overallAnalytics[muscleGroup][exerciseName] = {
            totalVolume: 0,
            totalSets: 0,
            workoutCount: 0,
            maxLiftedWeight: Number.NEGATIVE_INFINITY, // Max weight lifted across all sessions
            progression: [], // To store data points for charts
          };
        }

        const record = overallAnalytics[muscleGroup][exerciseName];
        record.totalVolume += totalVolume;
        record.totalSets += totalSets;
        record.workoutCount += 1;
        record.maxLiftedWeight = Math.max(record.maxLiftedWeight, maxWeight);
        record.progression.push({
          date: new Date(workout.workoutDate), // Store as Date object
          totalVolume: totalVolume,
          avgVolumePerSet: totalSets > 0 ? totalVolume / totalSets : 0,
          maxWeight: maxWeight, // Max weight for this specific workout session of this exercise
        });
      });
    });

    const totalWorkoutsCount = sortedWorkouts.length;
    const uniqueWorkoutDays = workoutDatesSet.size;
    const workoutFrequency = `You've completed ${totalWorkoutsCount} workout(s) over ${uniqueWorkoutDays} unique day(s).`;

    const finalMuscleGroupAnalytics = {};
    Object.keys(overallAnalytics).forEach((muscleGroup) => {
      finalMuscleGroupAnalytics[muscleGroup] = { exercises: {} };
      Object.keys(overallAnalytics[muscleGroup]).forEach((exerciseName) => {
        const rec = overallAnalytics[muscleGroup][exerciseName];
        const overallAvgVolumePerSet =
          rec.totalSets > 0 ? rec.totalVolume / rec.totalSets : 0;

        // Sort progression for consistent analysis and charting
        const sortedProgression = rec.progression.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        let progressionSummary = [
          "Not enough data for detailed progression analysis.",
        ];
        if (sortedProgression.length > 1) {
          progressionSummary = [];
          const firstSession = sortedProgression[0];
          const lastSession = sortedProgression[sortedProgression.length - 1];

          const volChange = lastSession.totalVolume - firstSession.totalVolume;
          const volChangePerc =
            firstSession.totalVolume !== 0
              ? (volChange / firstSession.totalVolume) * 100
              : lastSession.totalVolume > 0
              ? Infinity
              : 0; // Handle division by zero or no change from zero

          progressionSummary.push(
            `Volume: ${firstSession.totalVolume.toFixed(
              1
            )} → ${lastSession.totalVolume.toFixed(1)} (${
              volChangePerc !== Infinity
                ? volChangePerc.toFixed(1) + "%"
                : "Increased from 0"
            })`
          );

          const weightChange = lastSession.maxWeight - firstSession.maxWeight;
          const weightChangePerc =
            firstSession.maxWeight !== 0
              ? (weightChange / firstSession.maxWeight) * 100
              : lastSession.maxWeight > 0
              ? Infinity
              : 0;
          progressionSummary.push(
            `Max Weight: ${firstSession.maxWeight.toFixed(
              1
            )} → ${lastSession.maxWeight.toFixed(1)} (${
              weightChangePerc !== Infinity
                ? weightChangePerc.toFixed(1) + "%"
                : "Increased from 0"
            })`
          );
        }

        finalMuscleGroupAnalytics[muscleGroup].exercises[exerciseName] = {
          metrics: [
            `Total Volume: ${rec.totalVolume.toFixed(1)}`,
            `Avg Volume/Workout: ${(rec.totalVolume / rec.workoutCount).toFixed(
              1
            )}`,
            `Avg Volume/Set: ${overallAvgVolumePerSet.toFixed(1)}`,
            `Performed in: ${rec.workoutCount} workout(s)`,
            `Heaviest Lifted: ${rec.maxLiftedWeight.toFixed(1)}`, // Using the overall max
          ],
          progressionAnalysis: progressionSummary, // Separate progression text
          progressionData: sortedProgression, // Data for chart
        };
      });
    });

    setAnalytics({
      muscleGroupAnalytics: finalMuscleGroupAnalytics,
      workoutFrequency,
    });
  };

  const toggleExerciseDetails = (muscleGroup, exerciseName) => {
    const key = `${muscleGroup}-${exerciseName}`;
    setExpandedExercises((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Prepare minimal data for AI analysis
  const transformWorkoutsForAI = (rawWorkouts) =>
    rawWorkouts.map((workout) => ({
      workoutName: workout.workoutName,
      workoutDate: workout.workoutDate,
      exercises: (workout.exercises || []).map((ex) => ({
        muscleGroup: ex.muscleGroup,
        exercise: ex.exercise,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight, // AI might infer assisted from negative or need isAssistance
        weightType: ex.weightType,
        isAssistance: ex.isAssistance,
      })),
    }));

  const handleAIAnalysis = async () => {
    if (!Array.isArray(workouts) || workouts.length === 0) {
      toast.info("No workout data available to analyze.");
      return;
    }
    setIsLoadingAI(true);
    setAiInsights("🧠 Analyzing your workout patterns with AI... Please wait.");
    try {
      const minimalWorkouts = transformWorkoutsForAI(workouts);
      // Ensure the API URL is correctly set in your .env file
      const apiUrl = process.env.REACT_APP_CHATBOT_API_URL;
      if (!apiUrl) {
        throw new Error("Chatbot API URL is not configured.");
      }
      const response = await axios.post(
        apiUrl,
        {
          // Adjust payload based on your chatbot API's expected structure
          userInput:
            "Provide a summary and insights based on my workout history.",
          workoutHistory: minimalWorkouts,
          // context: "fitness_analysis", // Optional: provide context to AI
        },
        { headers: { "Content-Type": "application/json" } }
      );
      const aiResponse =
        response.data?.response ||
        response.data?.message ||
        "No specific insights received from AI.";
      setAiInsights(aiResponse);
    } catch (error) {
      console.error(
        "Error with AI Analysis:",
        error.response?.data || error.message || error
      );
      setAiInsights(
        `An error occurred during AI analysis: ${error.response?.data?.error ||
          error.message ||
          "Please try again later."}`
      );
      toast.error("AI Analysis failed.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (isLoadingWorkouts) {
    return (
      <div className="loading-message analytics-loading">
        Loading analytics data...
      </div>
    );
  }

  if (!Array.isArray(workouts) || workouts.length === 0) {
    return (
      <div className="analytics-container">
        <div className="analytics-title-container">
          <h3 className="analytics-title">Workout Analytics</h3>
        </div>
        <p className="no-workouts-message">
          No workout data available to analyze. Start logging your workouts!
        </p>
      </div>
    );
  }

  return (
    <div className="workout-analytics-page">
      {" "}
      {/* Added a wrapper class */}
      <div className="analytics-title-container">
        <h3 className="analytics-title">Workout Performance Insights</h3>
      </div>
      <div className="analytics-container">
        <p className="workout-frequency">{analytics.workoutFrequency}</p>

        <div className="ai-analysis-section">
          <button
            className="ai-analyze-btn"
            onClick={handleAIAnalysis}
            disabled={isLoadingAI || !workouts || workouts.length === 0}
            aria-label="Analyze workouts with Artificial Intelligence"
          >
            {isLoadingAI ? "Analyzing..." : "Get AI Insights"}
          </button>
          {aiInsights && (
            <div className="ai-insights" aria-live="polite">
              <h4>AI Generated Insights:</h4>
              {isLoadingAI && aiInsights.startsWith("🧠") ? ( // Check if it's the loading message
                <p>{aiInsights}</p>
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: formatAIText(aiInsights) }}
                />
              )}
            </div>
          )}
        </div>

        {Object.keys(analytics.muscleGroupAnalytics).map((muscleGroup) => (
          <div key={muscleGroup} className="muscle-group-section">
            <h4>{muscleGroup} Performance</h4>
            <div className="exercise-grid">
              {Object.keys(
                analytics.muscleGroupAnalytics[muscleGroup].exercises
              ).map((exerciseName) => {
                const exerciseData =
                  analytics.muscleGroupAnalytics[muscleGroup].exercises[
                    exerciseName
                  ];
                const isExpanded =
                  expandedExercises[`${muscleGroup}-${exerciseName}`];

                return (
                  <div
                    key={exerciseName}
                    className={`exercise-card ${isExpanded ? "expanded" : ""}`}
                    onClick={() =>
                      toggleExerciseDetails(muscleGroup, exerciseName)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleExerciseDetails(muscleGroup, exerciseName);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                    aria-controls={`details-${muscleGroup}-${exerciseName}`}
                  >
                    <h5>{exerciseName}</h5>
                    {isExpanded && (
                      <div
                        className="exercise-details"
                        id={`details-${muscleGroup}-${exerciseName}`}
                      >
                        <h6>Summary:</h6>
                        <ul>
                          {exerciseData.metrics.map((metric, idx) => (
                            <li key={`metric-${idx}`}>{metric}</li>
                          ))}
                        </ul>
                        <h6>Progression Analysis:</h6>
                        <ul>
                          {exerciseData.progressionAnalysis.map((item, idx) => (
                            <li key={`prog-analysis-${idx}`}>{item}</li>
                          ))}
                        </ul>
                        {exerciseData.progressionData &&
                          exerciseData.progressionData.length > 0 && (
                            <ProgressionChart
                              progressionData={exerciseData.progressionData}
                              exerciseName={exerciseName}
                            />
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutAnalytics;
