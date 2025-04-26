import React from "react";
import { Link, useParams, useLocation } from "react-router-dom";

/**
 * PatientHeader component
 *
 * Displays patient information header and navigation tabs for the nurse view
 *
 * @param {Object} props
 * @param {Object} props.patient - The patient object with details
 */
const PatientHeader = ({ patient }) => {
  const { id } = useParams();
  const location = useLocation();

  // If no patient data is passed, show a placeholder
  if (!patient) {
    return (
      <div className="bg-white shadow rounded-lg p-4 mb-6 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate patient age
  const calculateAge = (birthdate) => {
    const birth = new Date(birthdate);
    const now = new Date();

    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  // Format date to Thai format
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Navigation tabs for patient details
  const navTabs = [
    {
      name: "ข้อมูลผู้ป่วย",
      path: `/nurse/patients/${id}`,
      active: location.pathname === `/nurse/patients/${id}`,
    },
    {
      name: "ค่าน้ำตาล",
      path: `/nurse/patients/${id}/glucose`,
      active: location.pathname === `/nurse/patients/${id}/glucose`,
    },
    {
      name: "แผนการรักษา",
      path: `/nurse/patients/${id}/treatments`,
      active: location.pathname === `/nurse/patients/${id}/treatments`,
    },
  ];

  // CSS for active and inactive tabs
  const activeTabClass =
    "border-b-2 border-blue-500 text-blue-600 px-3 py-2 text-sm font-medium";
  const inactiveTabClass =
    "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent px-3 py-2 text-sm font-medium";

  // Risk level label and color
  const getRiskLevelBadge = (level) => {
    const levels = {
      high: { text: "ความเสี่ยงสูง", className: "bg-red-100 text-red-800" },
      medium: {
        text: "ความเสี่ยงปานกลาง",
        className: "bg-yellow-100 text-yellow-800",
      },
      low: { text: "ความเสี่ยงต่ำ", className: "bg-green-100 text-green-800" },
    };

    const defaultLevel = {
      text: level || "ไม่ระบุ",
      className: "bg-gray-100 text-gray-800",
    };
    return levels[level] || defaultLevel;
  };

  const riskLevel = getRiskLevelBadge(patient.riskLevel);

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      {/* Patient header info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            {patient.firstName} {patient.lastName}
            <span
              className={`ml-2 inline-block px-2 py-1 text-xs rounded-full ${riskLevel.className}`}
            >
              {riskLevel.text}
            </span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {patient.hospitalNumber ? `HN: ${patient.hospitalNumber} · ` : ""}
            อายุ: {calculateAge(patient.birthdate)} ปี · วันที่ฝากครรภ์:{" "}
            {formatDate(patient.pregnancyStartDate)}
          </p>
        </div>

        <div className="mt-4 md:mt-0">
          <Link
            to={`/nurse/patients/${id}`}
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm px-4 py-2 rounded-md font-medium"
          >
            ดูประวัติ
          </Link>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {navTabs.map((tab) => (
            <Link
              key={tab.name}
              to={tab.path}
              className={tab.active ? activeTabClass : inactiveTabClass}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default PatientHeader;
