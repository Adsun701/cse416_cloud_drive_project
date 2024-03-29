require('dotenv').config();

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL Node configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md
 */
const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID,
    // 'Application (client) ID' of app registration in Azure portal - this value is a GUID
    authority: process.env.CLOUD_INSTANCE + process.env.TENANT_ID, // Full directory URL, in the form of https://login.microsoftonline.com/<tenant>
    clientSecret: process.env.CLIENT_SECRET,
    // Client secret generated from the app registration in Azure portal
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message) {
        // eslint-disable-next-line no-console
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: 'Info',
    },
  },
};

const { REDIRECT_URI } = process.env;
const { POST_LOGOUT_REDIRECT_URI } = process.env;
const { GRAPH_API_ENDPOINT } = process.env;
const GRAPH_ME_ENDPOINT = `${process.env.GRAPH_API_ENDPOINT}v1.0/me/drive/root/children`;

module.exports = {
  msalConfig,
  REDIRECT_URI,
  POST_LOGOUT_REDIRECT_URI,
  GRAPH_API_ENDPOINT,
  GRAPH_ME_ENDPOINT,
};
