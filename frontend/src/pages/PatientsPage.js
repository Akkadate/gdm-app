import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PatientList from '../components/patients/PatientList';
import Loader from '../components/common/Loader';
import { useAlert } from '../contexts/AlertContext';
import patientService from '../services/patientService';

const PatientsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { error: showError } = useAlert();
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPatients, setTotalPatients] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  
  // Parse query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const page = parseInt(searchParams.get('page')) || 1;
    const search = searchParams.get('search') || '';
    const risk = searchParams.get('risk') || '';
    
    setCurrentPage(page);
    setSearchTerm(search);
    setRiskFilter(risk);
  }, [location.search]);
  
  // Fetch patients data
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        
        const params = {
          page: currentPage,
          limit: 10
        };
        
        if (searchTerm) {
          params.search = searchTerm;
        }
        
        if (riskFilter) {
          params.risk_level = riskFilter;
        }
        
        const response = await patientService.getPatients(params);
        
        setPatients(response.data);
        setTotalPatients(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      } catch (err) {
        console.error('Error fetching patients:', err);
        showError(err.message || 'ไม่สามารถโหลดข้อมูลผู้ป่วยได้');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatients();
  }, [currentPage, searchTerm, riskFilter, showError]);
  
  // Update URL with current filters and pagination
  useEffect(() => {
    const searchParams = new URLSearchParams();
    
    if (currentPage > 1) {
      searchParams.set('page', currentPage);
    }
    
    if (searchTerm) {
      searchParams.set('search', searchTerm);
    }
    
    if (riskFilter) {
      searchParams.set('risk', riskFilter);
    }
    
    const queryString = searchParams.toString();
    navigate({
      pathname: location.pathname,
      search: queryString ? `?${queryString}` : ''
    }, { replace: true });
  }, [currentPage, searchTerm, riskFilter, navigate, location.pathname]);
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on new search
  };
  
  const handleFilterChange = (risk) => {
    setRiskFilter(risk);
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  const handleDeletePatient = async (id) => {
    try {
      await patientService.deletePatient(id);
      
      // Refresh the list
      const newTotal = totalPatients - 1;
      
      // If deleting the last item on the page, go back one page
      if (patients.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        // Otherwise, just fetch the current page again
        const params = {
          page: currentPage,
          limit: 10,
          search: searchTerm,
          risk_level: riskFilter
        };
        
        const response = await patientService.getPatients(params);
        
        setPatients(response.data);
        setTotalPatients(newTotal);
        setTotalPages(Math.ceil(newTotal / 10));
      }
    } catch (err) {
      throw err;
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">รายชื่อผู้ป่วย</h1>
      
      <PatientList 
        patients={patients}
        totalPatients={totalPatients}
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        onPageChange={handlePageChange}
        onDelete={handleDeletePatient}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
};

export default PatientsPage;