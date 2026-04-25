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
