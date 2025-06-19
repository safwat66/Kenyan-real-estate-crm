import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl } from 'aws-amplify/storage';

const client = generateClient();

// GraphQL queries and mutations
const listApartments = /* GraphQL */ `
  query ListApartments {
    listApartments {
      items {
        id
        name
        location
        totalUnits
        floors
        unitsPerFloor
        description
        priceRange
        amenities
        imageUrl
        soldUnits
        availableUnits
        totalRevenue
        occupancyRate
        createdAt
        updatedAt
      }
    }
  }
`;

const createApartment = /* GraphQL */ `
  mutation CreateApartment($input: CreateApartmentInput!) {
    createApartment(input: $input) {
      id
      name
      location
      totalUnits
      floors
      unitsPerFloor
      description
      priceRange
      amenities
      imageUrl
      soldUnits
      availableUnits
      totalRevenue
      occupancyRate
      createdAt
      updatedAt
    }
  }
`;

const getApartment = /* GraphQL */ `
  query GetApartment($id: ID!) {
    getApartment(id: $id) {
      id
      name
      location
      totalUnits
      floors
      unitsPerFloor
      description
      priceRange
      amenities
      imageUrl
      soldUnits
      availableUnits
      totalRevenue
      occupancyRate
      units {
        items {
          id
          unitNumber
          floor
          area
          price
          bedrooms
          bathrooms
          unitType
          status
          createdAt
          updatedAt
        }
      }
      createdAt
      updatedAt
    }
  }
`;

const listUnits = /* GraphQL */ `
  query ListUnits($filter: ModelUnitFilterInput) {
    listUnits(filter: $filter) {
      items {
        id
        unitNumber
        floor
        area
        price
        bedrooms
        bathrooms
        unitType
        status
        apartmentId
        tenant {
          id
          name
          email
          phone
          status
        }
        createdAt
        updatedAt
      }
    }
  }
`;

const createUnit = /* GraphQL */ `
  mutation CreateUnit($input: CreateUnitInput!) {
    createUnit(input: $input) {
      id
      unitNumber
      floor
      area
      price
      bedrooms
      bathrooms
      unitType
      status
      apartmentId
      createdAt
      updatedAt
    }
  }
`;

const updateUnit = /* GraphQL */ `
  mutation UpdateUnit($input: UpdateUnitInput!) {
    updateUnit(input: $input) {
      id
      unitNumber
      floor
      area
      price
      bedrooms
      bathrooms
      unitType
      status
      apartmentId
      createdAt
      updatedAt
    }
  }
`;

const listTenants = /* GraphQL */ `
  query ListTenants($filter: ModelTenantFilterInput) {
    listTenants(filter: $filter) {
      items {
        id
        name
        email
        phone
        idNumber
        occupation
        emergencyContact
        monthlyIncome
        notes
        status
        joinDate
        unitId
        unit {
          id
          unitNumber
          apartment {
            id
            name
          }
        }
        createdAt
        updatedAt
      }
    }
  }
`;

const createTenant = /* GraphQL */ `
  mutation CreateTenant($input: CreateTenantInput!) {
    createTenant(input: $input) {
      id
      name
      email
      phone
      idNumber
      occupation
      emergencyContact
      monthlyIncome
      notes
      status
      joinDate
      unitId
      createdAt
      updatedAt
    }
  }
`;

// Service functions
export const apartmentService = {
  async getAll() {
    try {
      const result = await client.graphql({ query: listApartments });
      return result.data.listApartments.items;
    } catch (error) {
      console.error('Error fetching apartments:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const result = await client.graphql({ 
        query: getApartment, 
        variables: { id } 
      });
      return result.data.getApartment;
    } catch (error) {
      console.error('Error fetching apartment:', error);
      throw error;
    }
  },

  async create(apartmentData) {
    try {
      let imageUrl = null;
      
      // Handle image upload if provided
      if (apartmentData.image) {
        const imageKey = `property-images/${Date.now()}-${apartmentData.image.name}`;
        const uploadResult = await uploadData({
          key: imageKey,
          data: apartmentData.image,
          options: {
            contentType: apartmentData.image.type,
          },
        });
        
        // Get the URL for the uploaded image
        const urlResult = await getUrl({ key: imageKey });
        imageUrl = urlResult.url.toString();
      }

      const input = {
        name: apartmentData.name,
        location: apartmentData.location,
        totalUnits: parseInt(apartmentData.totalUnits),
        floors: parseInt(apartmentData.floors),
        unitsPerFloor: parseInt(apartmentData.unitsPerFloor),
        description: apartmentData.description,
        priceRange: apartmentData.priceRange,
        amenities: apartmentData.amenities,
        imageUrl,
        availableUnits: parseInt(apartmentData.totalUnits),
      };

      const result = await client.graphql({ 
        query: createApartment, 
        variables: { input } 
      });
      return result.data.createApartment;
    } catch (error) {
      console.error('Error creating apartment:', error);
      throw error;
    }
  },
};

export const unitService = {
  async getByApartment(apartmentId, floor = null) {
    try {
      const filter = { apartmentId: { eq: apartmentId } };
      if (floor) {
        filter.floor = { eq: parseInt(floor) };
      }

      const result = await client.graphql({ 
        query: listUnits, 
        variables: { filter } 
      });
      return result.data.listUnits.items;
    } catch (error) {
      console.error('Error fetching units:', error);
      throw error;
    }
  },

  async create(unitData) {
    try {
      const input = {
        unitNumber: unitData.unitNumber,
        floor: parseInt(unitData.floor),
        area: parseFloat(unitData.area),
        price: parseFloat(unitData.price),
        bedrooms: parseInt(unitData.bedrooms),
        bathrooms: parseInt(unitData.bathrooms),
        unitType: unitData.unitType,
        apartmentId: unitData.apartmentId,
      };

      const result = await client.graphql({ 
        query: createUnit, 
        variables: { input } 
      });
      return result.data.createUnit;
    } catch (error) {
      console.error('Error creating unit:', error);
      throw error;
    }
  },

  async updateStatus(unitId, status) {
    try {
      const input = {
        id: unitId,
        status,
      };

      const result = await client.graphql({ 
        query: updateUnit, 
        variables: { input } 
      });
      return result.data.updateUnit;
    } catch (error) {
      console.error('Error updating unit:', error);
      throw error;
    }
  },

  async getAvailable(apartmentId) {
    try {
      const filter = { 
        apartmentId: { eq: apartmentId },
        status: { eq: 'available' }
      };

      const result = await client.graphql({ 
        query: listUnits, 
        variables: { filter } 
      });
      return result.data.listUnits.items;
    } catch (error) {
      console.error('Error fetching available units:', error);
      throw error;
    }
  },
};

export const tenantService = {
  async getAll(searchTerm = '', status = 'all') {
    try {
      let filter = {};
      
      if (searchTerm) {
        filter.or = [
          { name: { contains: searchTerm } },
          { email: { contains: searchTerm } },
          { phone: { contains: searchTerm } },
        ];
      }
      
      if (status !== 'all') {
        filter.status = { eq: status };
      }

      const result = await client.graphql({ 
        query: listTenants, 
        variables: Object.keys(filter).length > 0 ? { filter } : {} 
      });
      return result.data.listTenants.items;
    } catch (error) {
      console.error('Error fetching tenants:', error);
      throw error;
    }
  },

  async create(tenantData) {
    try {
      const input = {
        name: tenantData.name,
        email: tenantData.email,
        phone: tenantData.phone,
        idNumber: tenantData.idNumber,
        occupation: tenantData.occupation,
        emergencyContact: tenantData.emergencyContact,
        monthlyIncome: tenantData.monthlyIncome ? parseFloat(tenantData.monthlyIncome) : null,
        notes: tenantData.notes,
        unitId: tenantData.unitId,
        joinDate: new Date().toISOString().split('T')[0],
      };

      const result = await client.graphql({ 
        query: createTenant, 
        variables: { input } 
      });
      return result.data.createTenant;
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  },
};

export const dashboardService = {
  async getStats(apartmentId) {
    try {
      // This would typically be a custom GraphQL query or computed from existing data
      // For now, we'll simulate the stats
      const apartment = await apartmentService.getById(apartmentId);
      const units = await unitService.getByApartment(apartmentId);
      
      const soldUnits = units.filter(unit => unit.status === 'sold' || unit.status === 'fully_paid').length;
      const availableUnits = units.filter(unit => unit.status === 'available').length;
      const reservedUnits = units.filter(unit => unit.status === 'reserved').length;
      
      const totalRevenue = units
        .filter(unit => unit.status === 'sold' || unit.status === 'fully_paid')
        .reduce((sum, unit) => sum + unit.price, 0);

      return {
        apartment: {
          totalUnits: apartment.totalUnits,
          soldUnits,
          availableUnits,
          reservedUnits,
          totalRevenue,
        },
        monthlyRevenue: [], // This would come from payment data
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },
};
