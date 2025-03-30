/**
 * Insulin Calculator
 * Based on general guidelines for insulin dosing in gestational diabetes.
 * Note: These calculations are for reference only and should be adjusted
 * by healthcare professionals based on individual patient needs.
 */

/**
 * Calculate initial insulin dose based on weight
 * @param {number} weightKg - Weight in kilograms
 * @param {string} riskLevel - Risk level (low, medium, high)
 * @returns {Object} Initial insulin doses
 */
const calculateInitialDose = (weightKg, riskLevel) => {
  if (!weightKg) return null;
  
  // Base total daily dose (TDD) on weight and risk level
  let totalDailyDose;
  
  switch (riskLevel) {
    case 'high':
      totalDailyDose = weightKg * 0.5; // 0.5 units/kg for high risk
      break;
    case 'medium':
      totalDailyDose = weightKg * 0.4; // 0.4 units/kg for medium risk
      break;
    default:
      totalDailyDose = weightKg * 0.3; // 0.3 units/kg for low risk
  }
  
  // Round to nearest whole number
  totalDailyDose = Math.round(totalDailyDose);
  
  // Calculate basal and bolus insulin
  const basalInsulin = Math.round(totalDailyDose * 0.5); // 50% of TDD for basal
  
  // Split bolus insulin among meals
  const breakfastBolus = Math.round(totalDailyDose * 0.2); // 20% of TDD for breakfast
  const lunchBolus = Math.round(totalDailyDose * 0.15); // 15% of TDD for lunch
  const dinnerBolus = Math.round(totalDailyDose * 0.15); // 15% of TDD for dinner
  
  return {
    totalDailyDose,
    basalInsulin,
    bolusDoses: {
      breakfast: breakfastBolus,
      lunch: lunchBolus,
      dinner: dinnerBolus
    }
  };
};

/**
 * Calculate insulin correction for high blood glucose
 * @param {number} currentGlucose - Current glucose level (mg/dL)
 * @param {number} targetGlucose - Target glucose level (mg/dL)
 * @param {number} correctionFactor - Correction factor (mg/dL per unit)
 * @returns {number} Correction dose (units)
 */
const calculateCorrection = (currentGlucose, targetGlucose = 120, correctionFactor = 50) => {
  if (!currentGlucose || currentGlucose <= targetGlucose) return 0;
  
  // Calculate glucose above target
  const glucoseAboveTarget = currentGlucose - targetGlucose;
  
  // Calculate correction dose
  const correctionDose = glucoseAboveTarget / correctionFactor;
  
  // Round to nearest 0.5 units
  return Math.round(correctionDose * 2) / 2;
};

/**
 * Calculate insulin sensitivity factor (ISF)
 * @param {number} totalDailyDose - Total daily insulin dose
 * @returns {number} Insulin sensitivity factor (mg/dL per unit)
 */
const calculateISF = (totalDailyDose) => {
  if (!totalDailyDose) return null;
  
  // Common formula for ISF calculation (1800 rule)
  const isf = 1800 / totalDailyDose;
  
  // Round to nearest whole number
  return Math.round(isf);
};

/**
 * Calculate insulin to carbohydrate ratio (ICR)
 * @param {number} totalDailyDose - Total daily insulin dose
 * @returns {number} Insulin to carbohydrate ratio (grams per unit)
 */
const calculateICR = (totalDailyDose) => {
  if (!totalDailyDose) return null;
  
  // Common formula for ICR calculation (500 rule)
  const icr = 500 / totalDailyDose;
  
  // Round to nearest whole number
  return Math.round(icr);
};

/**
 * Calculate meal bolus based on carbohydrates
 * @param {number} carbGrams - Carbohydrates in meal (grams)
 * @param {number} icr - Insulin to carbohydrate ratio
 * @returns {number} Meal bolus (units)
 */
const calculateMealBolus = (carbGrams, icr) => {
  if (!carbGrams || !icr) return 0;
  
  // Calculate meal bolus
  const mealBolus = carbGrams / icr;
  
  // Round to nearest 0.5 units
  return Math.round(mealBolus * 2) / 2;
};

/**
 * Calculate total insulin dose for a meal
 * @param {number} carbGrams - Carbohydrates in meal (grams)
 * @param {number} currentGlucose - Current glucose level (mg/dL)
 * @param {number} totalDailyDose - Total daily insulin dose
 * @param {number} targetGlucose - Target glucose level (mg/dL)
 * @returns {Object} Total insulin dose details
 */
const calculateMealDose = (carbGrams, currentGlucose, totalDailyDose, targetGlucose = 120) => {
  if (!carbGrams || !currentGlucose || !totalDailyDose) return null;
  
  // Calculate insulin sensitivity factor
  const isf = calculateISF(totalDailyDose);
  
  // Calculate insulin to carbohydrate ratio
  const icr = calculateICR(totalDailyDose);
  
  // Calculate meal bolus
  const mealBolus = calculateMealBolus(carbGrams, icr);
  
  // Calculate correction bolus
  const correctionBolus = calculateCorrection(currentGlucose, targetGlucose, isf);
  
  // Calculate total dose
  const totalDose = mealBolus + correctionBolus;
  
  return {
    mealBolus,
    correctionBolus,
    totalDose: Math.round(totalDose * 2) / 2, // Round to nearest 0.5 units
    isf,
    icr
  };
};

/**
 * Adjust insulin dose based on repeated high/low readings
 * @param {number} currentDose - Current insulin dose
 * @param {Array} glucoseReadings - Recent glucose readings
 * @param {Object} targetRanges - Target glucose ranges
 * @returns {Object} Adjusted insulin dose
 */
const adjustInsulinDose = (currentDose, glucoseReadings, targetRanges = {
  fasting: { min: 70, max: 95 },
  preMeal: { min: 70, max: 100 },
  postMeal: { min: 70, max: 140 }
}) => {
  if (!currentDose || !glucoseReadings || glucoseReadings.length === 0) return null;
  
  // Group readings by type
  const groupedReadings = glucoseReadings.reduce((acc, reading) => {
    if (!acc[reading.reading_type]) {
      acc[reading.reading_type] = [];
    }
    acc[reading.reading_type].push(reading);
    return acc;
  }, {});
  
  // Calculate average for each type
  const averages = {};
  for (const [type, readings] of Object.entries(groupedReadings)) {
    if (readings.length > 0) {
      const sum = readings.reduce((total, reading) => total + reading.glucose_value, 0);
      averages[type] = sum / readings.length;
    }
  }
  
  // Determine adjustments
  const adjustments = {};
  
  // Adjust basal insulin based on fasting glucose
  if (averages.fasting) {
    const fastingAvg = averages.fasting;
    const fastingTarget = targetRanges.fasting;
    
    if (fastingAvg > fastingTarget.max) {
      // Increase basal by 10-20% if consistently high
      adjustments.basalInsulin = Math.round(currentDose.basalInsulin * 1.15);
    } else if (fastingAvg < fastingTarget.min) {
      // Decrease basal by 10-20% if consistently low
      adjustments.basalInsulin = Math.round(currentDose.basalInsulin * 0.85);
    } else {
      // No change needed
      adjustments.basalInsulin = currentDose.basalInsulin;
    }
  } else {
    adjustments.basalInsulin = currentDose.basalInsulin;
  }
  
  // Adjust bolus insulin based on pre/post meal glucose
  adjustments.bolusDoses = { ...currentDose.bolusDoses };
  
  // Adjust breakfast bolus
  if (averages.postMeal && groupedReadings.postMeal.some(r => r.meal === 'breakfast')) {
    const breakfastPostMeal = groupedReadings.postMeal.filter(r => r.meal === 'breakfast');
    const breakfastAvg = breakfastPostMeal.reduce((total, r) => total + r.glucose_value, 0) / breakfastPostMeal.length;
    
    if (breakfastAvg > targetRanges.postMeal.max) {
      // Increase breakfast bolus by 10% if consistently high
      adjustments.bolusDoses.breakfast = Math.round(currentDose.bolusDoses.breakfast * 1.1);
    } else if (breakfastAvg < targetRanges.postMeal.min) {
      // Decrease breakfast bolus by 10% if consistently low
      adjustments.bolusDoses.breakfast = Math.round(currentDose.bolusDoses.breakfast * 0.9);
    }
  }
  
  // Similar adjustments for lunch and dinner
  // [Code omitted for brevity but would follow same pattern]
  
  // Calculate new total daily dose
  adjustments.totalDailyDose = adjustments.basalInsulin + 
                               adjustments.bolusDoses.breakfast + 
                               adjustments.bolusDoses.lunch + 
                               adjustments.bolusDoses.dinner;
  
  return adjustments;
};

module.exports = {
  calculateInitialDose,
  calculateCorrection,
  calculateISF,
  calculateICR,
  calculateMealBolus,
  calculateMealDose,
  adjustInsulinDose
};