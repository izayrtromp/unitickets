const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SENSITIVE_KEYS = ['password', 'passwordHash', 'token', 'verificationToken', 'passwordResetToken', 'jwt', 'cookie', 'secret'];

const sanitizeMetadata = (metadata) => {
  if (!metadata) return null;
  if (typeof metadata !== 'object') return metadata;
  
  const sanitized = { ...metadata };
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_KEYS.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeMetadata(sanitized[key]); // recursive sanitization
    }
  }
  return sanitized;
};

/**
 * Safely logs an administrative action to the AuditLog table.
 * Does not throw errors so it won't interrupt the main transaction.
 */
async function logAuditAction({ actor, action, targetType, targetId, targetLabel, metadata }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id || null,
        actorEmail: actor?.email || null,
        actorName: actor?.name || null,
        action,
        targetType,
        targetId,
        targetLabel,
        metadata: sanitizeMetadata(metadata)
      }
    });
  } catch (error) {
    console.error('Audit Logging Failed:', error.message);
  }
}

module.exports = { logAuditAction };
