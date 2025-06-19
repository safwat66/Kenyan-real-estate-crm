import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'realEstateStorage',
  access: (allow) => ({
    'property-images/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'documents/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'reports/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  }),
});
