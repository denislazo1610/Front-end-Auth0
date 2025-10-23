import 'dotenv/config';

export default {
  expo: {
    name: 'fitmatch-auth0',
    slug: 'fitmatch-auth0',
    scheme: 'fitmatch',
    extra: {
      auth0Domain: process.env.AUTH0_DOMAIN,
      auth0ClientId: process.env.AUTH0_CLIENT_ID,
      auth0Audience: process.env.AUTH0_AUDIENCE,
      backEndAPI: process.env.BACKEND_API,
    },
  },
};