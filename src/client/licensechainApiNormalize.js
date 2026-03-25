/**
 * Vendored copy — keep in sync with:
 * - LicenseChain-TG-Bot/src/client/licensechainApiNormalize.js (identical)
 * - api/src/contracts/bot-license-contracts.ts
 */

function parseAxiosLikeError(err) {
  const status = err?.response?.status ?? null;
  const data = err?.response?.data;
  let message =
    (typeof data === 'object' && data !== null && typeof data.message === 'string' && data.message) ||
    (typeof data === 'object' && data !== null && typeof data.error === 'string' && data.error) ||
    err?.message ||
    'Request failed';
  const code =
    typeof data === 'object' && data !== null && typeof data.code === 'string' ? data.code : undefined;
  return { httpStatus: status, message: String(message), body: data ?? null, code };
}

class LicenseChainApiError extends Error {
  constructor(context, parsed) {
    super(`${context}: ${parsed.message}`);
    this.name = 'LicenseChainApiError';
    this.context = context;
    this.httpStatus = parsed.httpStatus;
    this.apiBody = parsed.body;
    this.apiCode = parsed.code;
  }
}

function normalizeAxiosError(err, context) {
  const parsed = parseAxiosLikeError(err);
  return new LicenseChainApiError(context, parsed);
}

function normalizeVerifyPayload(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, reason: 'invalid_api_payload' };
  }
  const o = data;
  return {
    ...o,
    valid: Boolean(o.valid),
    reason: typeof o.reason === 'string' ? o.reason : o.reason != null ? String(o.reason) : undefined,
    status: typeof o.status === 'string' ? o.status : o.status != null ? String(o.status) : undefined,
    expiresAt:
      typeof o.expiresAt === 'string'
        ? o.expiresAt
        : o.expiresAt instanceof Date
          ? o.expiresAt.toISOString()
          : o.expiresAt === null
            ? null
            : o.expiresAt,
    email: typeof o.email === 'string' ? o.email : o.email,
    verificationType: typeof o.verificationType === 'string' ? o.verificationType : o.verificationType,
    error: typeof o.error === 'string' ? o.error : o.error,
    hardwareId: typeof o.hardwareId === 'string' ? o.hardwareId : o.hardwareId,
  };
}

module.exports = {
  LicenseChainApiError,
  parseAxiosLikeError,
  normalizeAxiosError,
  normalizeVerifyPayload,
};
