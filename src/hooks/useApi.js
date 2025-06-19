import { useState } from 'react';
import { apartmentService, unitService, tenantService, dashboardService } from '../services/graphqlService';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      let data;
      
      // Route the API calls to appropriate GraphQL services
      if (endpoint === '/apartments') {
        if (options.method === 'POST') {
          // This would be handled by apiCallFormData
          throw new Error('Use apiCallFormData for apartment creation');
        } else {
          data = await apartmentService.getAll();
        }
      } else if (endpoint.startsWith('/apartments/')) {
        const id = endpoint.split('/')[2];
        data = await apartmentService.getById(id);
      } else if (endpoint.startsWith('/units')) {
        const urlParams = new URLSearchParams(endpoint.split('?')[1]);
        const apartmentId = urlParams.get('apartmentId');
        const floor = urlParams.get('floor');
        const status = urlParams.get('status');
        
        if (options.method === 'POST') {
          const unitData = JSON.parse(options.body);
          data = await unitService.create(unitData);
        } else if (options.method === 'PATCH') {
          const { unitId, status } = JSON.parse(options.body);
          data = await unitService.updateStatus(unitId, status);
        } else if (status === 'available') {
          data = await unitService.getAvailable(apartmentId);
        } else {
          data = await unitService.getByApartment(apartmentId, floor);
        }
      } else if (endpoint.startsWith('/tenants')) {
        const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
        const searchTerm = urlParams.get('search') || '';
        const status = urlParams.get('status') || 'all';
        
        if (options.method === 'POST') {
          const tenantData = JSON.parse(options.body);
          data = await tenantService.create(tenantData);
        } else {
          data = await tenantService.getAll(searchTerm, status);
        }
      } else if (endpoint.startsWith('/dashboard/stats')) {
        const urlParams = new URLSearchParams(endpoint.split('?')[1]);
        const apartmentId = urlParams.get('apartmentId');
        data = await dashboardService.getStats(apartmentId);
      } else {
        throw new Error(`Unsupported endpoint: ${endpoint}`);
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const apiCallFormData = async (endpoint, formData) => {
    setLoading(true);
    setError(null);

    try {
      let data;
      
      if (endpoint === '/apartments') {
        // Convert FormData to object
        const apartmentData = {};
        for (let [key, value] of formData.entries()) {
          apartmentData[key] = value;
        }
        data = await apartmentService.create(apartmentData);
      } else {
        throw new Error(`Unsupported FormData endpoint: ${endpoint}`);
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    apiCall,
    apiCallFormData,
    loading,
    error,
    setError
  };
};

export default useApi;
