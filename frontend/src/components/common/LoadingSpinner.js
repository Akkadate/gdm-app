import React from "react";

/**
 * LoadingSpinner component
 * A reusable loading indicator that can be used throughout the application
 *
 * @param {Object} props
 * @param {string} props.size - Size of the spinner (sm, md, lg)
 * @param {string} props.color - Color of the spinner (primary, secondary, white)
 * @param {string} props.text - Optional text to display with the spinner
 * @param {boolean} props.fullScreen - Whether to display the spinner in full screen mode
 */
const LoadingSpinner = ({
  size = "md",
  color = "primary",
  text,
  fullScreen = false,
}) => {
  // Define spinner sizes
  const sizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  // Define spinner colors
  const colors = {
    primary: "text-blue-600",
    secondary: "text-gray-600",
    white: "text-white",
    green: "text-green-600",
    red: "text-red-600",
  };

  // Get proper classes based on props
  const sizeClass = sizes[size] || sizes.md;
  const colorClass = colors[color] || colors.primary;

  // Full screen overlay
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-5 rounded-lg shadow-lg flex flex-col items-center">
          <svg
            className={`animate-spin ${sizeClass} ${colorClass}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {text && <span className="mt-3 text-gray-700">{text}</span>}
        </div>
      </div>
    );
  }

  // Regular spinner
  return (
    <div className="flex items-center justify-center">
      <svg
        className={`animate-spin ${sizeClass} ${colorClass}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {text && <span className="ml-3">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
