import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Check, Info } from 'lucide-react';
import { useAlert } from '../../contexts/AlertContext';

/**
 * Risk Assessment modal component for evaluating patient's GDM risk
 * @param {Object} props - Component props
 * @param {Object} props.patient - Patient data
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onAssess - Function to handle risk assessment submission
 * @returns {JSX.Element} Risk assessment component
 */
const RiskAssessment = ({ patient, onClose, onAssess }) => {
  const { success, error: showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    family_history_diabetes: false,
    previous_gdm: false,
    previous_macrosomia: false,
    pre_pregnancy_weight: '',
    height: '',
    bmi: null,
    age: null,
  });
  
  // Initialize form with patient data if available
  useEffect(() => {
    if (patient) {
      // Calculate age from date of birth
      let age = null;
      if (patient.date_of_birth) {
        const birthDate = new Date(patient.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }
      
      setFormData({
        family_history_diabetes: patient.family_history_diabetes || false,
        previous_gdm: patient.previous_gdm || false,
        previous_macrosomia: patient.previous_macrosomia || false,
        pre_pregnancy_weight: patient.pre_pregnancy_weight || '',
        height: patient.height || '',
        bmi: patient.bmi || null,
        age: age
      });
    }
  }, [patient]);
  
  // Calculate BMI when weight or height changes
  useEffect(() => {
    if (formData.pre_pregnancy_weight && formData.height) {
      const heightInMeters = formData.height / 100;
      const bmi = formData.pre_pregnancy_weight / (heightInMeters * heightInMeters);
      setFormData({
        ...formData,
        bmi: Math.round(bmi * 100) / 100
      });
    }
  }, [formData.pre_pregnancy_weight, formData.height]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Calculate risk level based on risk factors
  const calculateRiskLevel = () => {
    let riskScore = 0;
    const riskFactors = [];
    
    // Check age (≥35 years)
    if (formData.age && formData.age >= 35) {
      riskScore += 1;
      riskFactors.push('อายุ ≥ 35 ปี');
    }
    
    // Check BMI (≥30 kg/m²)
    if (formData.bmi && formData.bmi >= 30) {
      riskScore += 1;
      riskFactors.push('BMI ≥ 30 kg/m²');
    }
    
    // Check family history of diabetes
    if (formData.family_history_diabetes) {
      riskScore += 1;
      riskFactors.push('ประวัติครอบครัวเป็นเบาหวาน');
    }
    
    // Check previous GDM
    if (formData.previous_gdm) {
      riskScore += 3; // Higher weight for previous GDM
      riskFactors.push('เคยเป็นเบาหวานขณะตั้งครรภ์');
    }
    
    // Check previous macrosomia (baby >4kg)
    if (formData.previous_macrosomia) {
      riskScore += 1;
      riskFactors.push('เคยคลอดบุตรน้ำหนักเกิน 4 กก.');
    }
    
    // Determine risk level
    let riskLevel = 'low';
    if (formData.previous_gdm || riskScore >= 3) {
      riskLevel = 'high';
    } else if (riskScore >= 1) {
      riskLevel = 'medium';
    }
    
    return { riskLevel, riskScore, riskFactors };
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Calculate risk assessment
      const { riskLevel, riskScore, riskFactors } = calculateRiskLevel();
      
      // Prepare risk data
      const riskData = {
        ...patient,
        risk_level: riskLevel,
        risk_score: riskScore,
        risk_factors: riskFactors,
        family_history_diabetes: formData.family_history_diabetes,
        previous_gdm: formData.previous_gdm,
        previous_macrosomia: formData.previous_macrosomia,
        pre_pregnancy_weight: formData.pre_pregnancy_weight || patient.pre_pregnancy_weight,
        height: formData.height || patient.height,
        bmi: formData.bmi || patient.bmi
      };
      
      // Call the onAssess function with risk data
      await onAssess(riskData);
      
      success('ประเมินความเสี่ยงเรียบร้อยแล้ว');
      onClose();
    } catch (err) {
      console.error('Risk assessment error:', err);
      showError(err.message || 'เกิดข้อผิดพลาดในการประเมินความเสี่ยง');
    } finally {
      setLoading(false);
    }
  };
  
  // Get risk level badge color
  const getRiskBadgeColor = (bmi) => {
    if (!bmi) return 'bg-gray-100 text-gray-800';
    
    if (bmi >= 30) {
      return 'bg-red-100 text-red-800';
    } else if (bmi >= 25) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (bmi >= 18.5) {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  // Get BMI interpretation
  const getBmiCategory = (bmi) => {
    if (!bmi) return '';
    
    if (bmi >= 30) {
      return 'อ้วน (Obesity)';
    } else if (bmi >= 25) {
      return 'น้ำหนักเกิน (Overweight)';
    } else if (bmi >= 18.5) {
      return 'ปกติ (Normal)';
    } else {
      return 'น้ำหนักน้อย (Underweight)';
    }
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  ประเมินความเสี่ยงเบาหวานขณะตั้งครรภ์
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    กรุณาตรวจสอบปัจจัยเสี่ยงเพื่อประเมินโอกาสการเกิดเบาหวานขณะตั้งครรภ์ของคนไข้
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="space-y-4">
                    {/* BMI section */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          น้ำหนักก่อนตั้งครรภ์ (กก.)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          name="pre_pregnancy_weight"
                          value={formData.pre_pregnancy_weight}
                          onChange={handleChange}
                          min="30"
                          max="200"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="น้ำหนักก่อนตั้งครรภ์"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ส่วนสูง (ซม.)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          name="height"
                          value={formData.height}
                          onChange={handleChange}
                          min="100"
                          max="250"
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="ส่วนสูง"
                        />
                      </div>
                    </div>
                    
                    {/* BMI result */}
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">ค่า BMI:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadgeColor(formData.bmi)}`}>
                          {formData.bmi ? `${formData.bmi} kg/m² (${getBmiCategory(formData.bmi)})` : 'รอข้อมูล'}
                        </span>
                      </div>
                      {formData.bmi && formData.bmi >= 30 && (
                        <div className="mt-2 flex items-start">
                          <Info className="h-4 w-4 text-yellow-500 mr-1 mt-0.5" />
                          <p className="text-xs text-gray-600">
                            BMI ≥ 30 kg/m² เป็นปัจจัยเสี่ยงต่อการเกิดเบาหวานขณะตั้งครรภ์
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Risk factors checkboxes */}
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          id="family_history_diabetes"
                          type="checkbox"
                          name="family_history_diabetes"
                          checked={formData.family_history_diabetes}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="family_history_diabetes" className="ml-2 block text-sm text-gray-700">
                          มีประวัติเบาหวานในครอบครัว
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="previous_gdm"
                          type="checkbox"
                          name="previous_gdm"
                          checked={formData.previous_gdm}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="previous_gdm" className="ml-2 block text-sm text-gray-700">
                          เคยเป็นเบาหวานขณะตั้งครรภ์มาก่อน
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="previous_macrosomia"
                          type="checkbox"
                          name="previous_macrosomia"
                          checked={formData.previous_macrosomia}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="previous_macrosomia" className="ml-2 block text-sm text-gray-700">
                          เคยคลอดบุตรน้ำหนักมากกว่า 4 กิโลกรัม
                        </label>
                      </div>
                    </div>
                    
                    {/* Age display */}
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 mr-2">อายุ:</span>
                      <span className="text-sm text-gray-900">{formData.age || 'ไม่ระบุ'} ปี</span>
                      {formData.age && formData.age >= 35 && (
                        <span className="ml-2 text-xs text-yellow-600">
                          (อายุมากกว่า 35 ปี เป็นปัจจัยเสี่ยง)
                        </span>
                      )}
                    </div>
                    
                    {/* Risk calculation preview */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">ผลการประเมินความเสี่ยง</h4>
                      {(() => {
                        const { riskLevel, riskScore } = calculateRiskLevel();
                        
                        let statusColor, statusText;
                        if (riskLevel === 'high') {
                          statusColor = 'text-red-600';
                          statusText = 'ความเสี่ยงสูง';
                        } else if (riskLevel === 'medium') {
                          statusColor = 'text-yellow-600';
                          statusText = 'ความเสี่ยงปานกลาง';
                        } else {
                          statusColor = 'text-green-600';
                          statusText = 'ความเสี่ยงต่ำ';
                        }
                        
                        return (
                          <p className={`text-base font-medium ${statusColor}`}>
                            {statusText} (คะแนนความเสี่ยง: {riskScore})
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" /> บันทึกการประเมิน
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={onClose}
                    >
                      <X className="mr-2 h-4 w-4" /> ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskAssessment;