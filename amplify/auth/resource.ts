import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      required: true,
    },
    given_name: {
      required: true,
    },
    family_name: {
      required: true,
    },
    phone_number: {
      required: false,
    },
  },
});
