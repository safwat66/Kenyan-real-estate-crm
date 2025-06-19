import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Apartment/Property Model
  Apartment: a
    .model({
      name: a.string().required(),
      location: a.string().required(),
      totalUnits: a.integer().required(),
      floors: a.integer().required(),
      unitsPerFloor: a.integer().required(),
      description: a.string(),
      priceRange: a.string(),
      amenities: a.string(),
      imageUrl: a.string(),
      soldUnits: a.integer().default(0),
      availableUnits: a.integer(),
      totalRevenue: a.float().default(0),
      occupancyRate: a.float().default(0),
      units: a.hasMany('Unit', 'apartmentId'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Unit Model
  Unit: a
    .model({
      unitNumber: a.string().required(),
      floor: a.integer().required(),
      area: a.float().required(),
      price: a.float().required(),
      bedrooms: a.integer().required(),
      bathrooms: a.integer().required(),
      unitType: a.string().required(),
      status: a.enum(['available', 'reserved', 'sold', 'installment', 'fully_paid']).default('available'),
      apartmentId: a.id().required(),
      apartment: a.belongsTo('Apartment', 'apartmentId'),
      tenant: a.hasOne('Tenant', 'unitId'),
      payments: a.hasMany('Payment', 'unitId'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Tenant Model
  Tenant: a
    .model({
      name: a.string().required(),
      email: a.email().required(),
      phone: a.phone().required(),
      idNumber: a.string(),
      occupation: a.string(),
      emergencyContact: a.string(),
      monthlyIncome: a.float(),
      notes: a.string(),
      status: a.enum(['current', 'installment', 'overdue', 'completed']).default('current'),
      joinDate: a.date(),
      unitId: a.id().required(),
      unit: a.belongsTo('Unit', 'unitId'),
      payments: a.hasMany('Payment', 'tenantId'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Payment Model
  Payment: a
    .model({
      amount: a.float().required(),
      paymentDate: a.date().required(),
      paymentMethod: a.enum(['cash', 'bank_transfer', 'mobile_money', 'cheque']).required(),
      description: a.string(),
      receiptNumber: a.string(),
      tenantId: a.id().required(),
      tenant: a.belongsTo('Tenant', 'tenantId'),
      unitId: a.id().required(),
      unit: a.belongsTo('Unit', 'unitId'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Dashboard Stats Model (for caching)
  DashboardStats: a
    .model({
      apartmentId: a.id().required(),
      totalUnits: a.integer().required(),
      soldUnits: a.integer().required(),
      availableUnits: a.integer().required(),
      reservedUnits: a.integer().required(),
      totalRevenue: a.float().required(),
      monthlyRevenue: a.json(),
      lastUpdated: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
