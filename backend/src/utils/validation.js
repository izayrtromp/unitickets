/**
 * Validates whether an email belongs to the University of Aruba domain.
 * Security reasoning: Enforces domain-level restriction for self-registration, 
 * ensuring only authorized academic members can access the ticketing system.
 */
const isValidUAEmail = (email) => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const parts = normalized.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return domain === 'ua.aw' || domain.endsWith('.ua.aw');
};

module.exports = {
  isValidUAEmail,
};
