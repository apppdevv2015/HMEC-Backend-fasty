/**
 * Unified Response Formatter Helper
 */
const formatResponse = (success, message = '', data = null, error = null) => {
    return {
        success,
        message,
        data,
        error: error ? (typeof error === 'string' ? error : error.message || String(error)) : null,
        timestamp: new Date().toISOString()
    };
};

module.exports = { formatResponse };
