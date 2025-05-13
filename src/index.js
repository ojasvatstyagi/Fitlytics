import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

// Scroll-based background gradient effect
document.addEventListener("scroll", () => {
  const scrollPosition = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const scrollPercent = scrollPosition / maxScroll;

  const startColor = [78, 173, 255]; // Blue
  const endColor = [170, 219, 243]; // Light gray

  const r = Math.round(
    startColor[0] + (endColor[0] - startColor[0]) * scrollPercent
  );
  const g = Math.round(
    startColor[1] + (endColor[1] - startColor[1]) * scrollPercent
  );
  const b = Math.round(
    startColor[2] + (endColor[2] - startColor[2]) * scrollPercent
  );

  document.body.style.background = `rgb(${r}, ${g}, ${b})`;
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      draggable
      pauseOnHover
    />
  </React.StrictMode>
);

reportWebVitals();
