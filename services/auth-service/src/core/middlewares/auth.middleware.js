const {
  authenticateJwt,
  authorizeRoles,
} = require('../../runtime');

const authenticateRequest = authenticateJwt({
  trustInternalUserContext: true,
});

module.exports = {
  authenticateRequest,
  authorizeRoles,
};
