'use strict';
/*eslint no-process-env:0*/

// Production specific configuration
// =================================

module.exports = {
  // Server IP
  ip: process.env.OPENSHIFT_NODEJS_IP || process.env.ip || undefined,

  // Server port
  port: process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080,

  // MongoDB connection options
  mongo: {
    uri: 'mongodb://fantasylive:fantasylive@ds027495.mlab.com:27495/fanstasylive'
    /*process.env.MONGODB_URI
      || process.env.MONGOHQ_URL
      || process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME
      || 'mongodb://localhost/fan4life'*/
  }
};
//# sourceMappingURL=production.js.map
