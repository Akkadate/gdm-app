import React, { createContext, useState, useContext } from 'react';

// Create alert context
const AlertContext = createContext();

// Alert provider component
export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  // Add alert
  const addAlert = (type, message, timeout = 5000) => {
    // Generate a unique ID for the alert
    const id = new Date().getTime();
    
    // Add new alert to the alerts array
    setAlerts(prevAlerts => [...prevAlerts, { id, type, message }]);
    
    // Auto-dismiss alert after timeout
    if (timeout) {
      setTimeout(() => {
        removeAlert(id);
      }, timeout);
    }
    
    return id;
  };
  
  // Success alert helper
  const success = (message, timeout) => {
    return addAlert('success', message, timeout);
  };
  
  // Error alert helper
  const error = (message, timeout) => {
    return addAlert('error', message, timeout);
  };
  
  // Warning alert helper
  const warning = (message, timeout) => {
    return addAlert('warning', message, timeout);
  };
  
  // Info alert helper
  const info = (message, timeout) => {
    return addAlert('info', message, timeout);
  };
  
  // Remove alert
  const removeAlert = (id) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
  };
  
  // Clear all alerts
  const clearAlerts = () => {
    setAlerts([]);
  };

  // Context value
  const value = {
    alerts,
    addAlert,
    success,
    error,
    warning,
    info,
    removeAlert,
    clearAlerts
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};

// Custom hook to use alert context
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export default AlertContext;