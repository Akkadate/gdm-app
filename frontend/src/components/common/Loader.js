import React from 'react';

const Loader = ({ size = 'medium', color = 'blue', fullScreen = false }) => {
  // Set spinner size
  let spinnerSize;
  switch (size) {
    case 'small':
      spinnerSize = 'h-4 w-4 border-2';
      break;
    case 'large':
      spinnerSize = 'h-12 w-12 border-4';
      break;
    case 'medium':
    default:
      spinnerSize = 'h-8 w-8 border-3';
      break;
  }
  
  // Set spinner color
  let spinnerColor;
  switch (color) {
    case 'white':
      spinnerColor = 'border-white';
      break;
    case 'gray':
      spinnerColor = 'border-gray-500';
      break;
    case 'blue':
    default:
      spinnerColor = 'border-blue-600';
      break;
  }
  
  const spinnerClasses = `animate-spin rounded-full ${spinnerSize} border-t-transparent ${spinnerColor}`;
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className={spinnerClasses}></div>
      </div>
    );
  }
  
  return (
    <div className="flex justify-center items-center p-4">
      <div className={spinnerClasses}></div>
    </div>
  );
};

export default Loader;