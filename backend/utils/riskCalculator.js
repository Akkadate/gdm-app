const config = require('../config/config');

/**
 * Calculate BMI (Body Mass Index)
 * @param {number} weightKg - Weight in kilograms
 * @param {number} heightCm - Height in centimeters
 * @returns {number} BMI value
 */
const calculateBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm) return null;
  
  // Convert height from cm to meters
  const heightM = heightCm / 100;
  
  // Calculate BMI: weight(kg) / height(m)^2
  const bmi = weightKg / (heightM * heightM);
  
  // Round to 2 decimal places
  return Math.round(bmi * 100) / 100;
};

/**
 * Calculate age from date of birth
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {number} Age in years
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Calculate risk factors and score
 * @param {Object} patientData - Patient data
 * @returns {Object} Risk assessment result
 */
const calculateRiskFactors = (patientData) => {
  const riskFactors = [];
  let riskScore = 0;
  
  // Calculate BMI if not provided
  const bmi = patientData.bmi || 
              calculateBMI(patientData.pre_pregnancy_weight, patientData.height);
  
  // Calculate age if not provided
  const age = patientData.age || 
              calculateAge(patientData.date_of_birth);
  
  // Check age (≥35 years)
  if (age && age >= 35) {
    riskFactors.push('Age ≥ 35');
    riskScore += config.riskWeights.age35plus;
  }
  
  // Check BMI (≥30 kg/m²)
  if (bmi && bmi >= 30) {
    riskFactors.push('BMI ≥ 30');
    riskScore += config.riskWeights.bmi30plus;
  }
  
  // Check family history of diabetes
  if (patientData.family_history_diabetes) {
    riskFactors.push('Family history of diabetes');
    riskScore += config.riskWeights.familyHistory;
  }
  
  // Check previous gestational diabetes
  if (patientData.previous_gdm) {
    riskFactors.push('Previous GDM');
    riskScore += config.riskWeights.previousGDM;
  }
  
  // Check previous macrosomia (baby >4kg)
  if (patientData.previous_macrosomia) {
    riskFactors.push('Previous macrosomia');
    riskScore += config.riskWeights.previousMacrosomia;
  }
  
  return { riskFactors, riskScore };
};

/**
 * Determine risk level based on risk score
 * @param {number} riskScore - Risk score value
 * @param {boolean} previousGDM - Previous gestational diabetes flag
 * @returns {string} Risk level (low, medium, high)
 */
const determineRiskLevel = (riskScore, previousGDM) => {
  // Previous GDM is an automatic high-risk factor
  if (previousGDM) {
    return 'high';
  }
  
  // Determine risk level based on score
  if (riskScore >= 3) {
    return 'high';
  } else if (riskScore >= 1) {
    return 'medium';
  } else {
    return 'low';
  }
};

/**
 * Calculate overall risk assessment
 * @param {Object} patientData - Patient data
 * @returns {Object} Risk assessment object
 */
const calculateRisk = (patientData) => {
  // Calculate risk factors and score
  const { riskFactors, riskScore } = calculateRiskFactors(patientData);
  
  // Determine risk level
  const riskLevel = determineRiskLevel(riskScore, patientData.previous_gdm);
  
  return {
    bmi: patientData.bmi || calculateBMI(patientData.pre_pregnancy_weight, patientData.height),
    age: patientData.age || calculateAge(patientData.date_of_birth),
    riskFactors,
    riskScore,
    riskLevel
  };
};

module.exports = {
  calculateBMI,
  calculateAge,
  calculateRiskFactors,
  determineRiskLevel,
  calculateRisk
};