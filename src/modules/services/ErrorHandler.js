import { message, notification } from 'antd';

/**
 * Centralized error handling service for consistent user feedback
 * Provides methods for handling different types of errors with appropriate UI feedback
 */
class ErrorHandler {
	/**
	 * Handle API errors with user-friendly messages
	 * @param {Error} error - The error object from axios or fetch
	 * @param {string} context - Optional context description (e.g., "Failed to load studies")
	 * @returns {string} - The extracted error message
	 */
	static handleAPIError(error, context = '') {
		const errorMsg = this.extractErrorMessage(error);
		const status = error.response?.status;

		// Log to console for debugging
		console.error(`API Error [${context}]:`, {
			message: errorMsg,
			status,
			data: error.response?.data,
			config: error.config,
		});

		// Show user notification based on status code
		const content = context ? `${context}: ${errorMsg}` : errorMsg;

		if (status >= 500) {
			notification.error({
				message: 'Server Error',
				description: content,
				duration: 8,
			});
		} else if (status === 404) {
			message.warning({
				content: `${context || 'Resource'} not found`,
				duration: 5,
			});
		} else if (status === 401 || status === 403) {
			notification.warning({
				message: 'Authentication Required',
				description: 'Please check your credentials or permissions',
				duration: 6,
			});
		} else if (status === 429) {
			notification.warning({
				message: 'Rate Limit Exceeded',
				description: 'Too many requests. Please wait a moment and try again.',
				duration: 6,
			});
		} else if (!status && error.message === 'Network Error') {
			notification.error({
				message: 'Network Error',
				description: 'Unable to connect to the server. Please check your internet connection.',
				duration: 8,
			});
		} else {
			message.error({
				content,
				duration: 5,
			});
		}

		return errorMsg;
	}

	/**
	 * Handle validation errors
	 * @param {string} field - The field that failed validation
	 * @param {string} errorMessage - The validation error message
	 */
	static handleValidationError(field, errorMessage) {
		notification.warning({
			message: 'Validation Error',
			description: `${field}: ${errorMessage}`,
			duration: 5,
		});
	}

	/**
	 * Handle file parsing errors
	 * @param {string} fileName - The name of the file that failed to parse
	 * @param {string} errorDetails - Details about the parsing error
	 */
	static handleFileError(fileName, errorDetails) {
		notification.error({
			message: `Error Processing ${fileName}`,
			description: errorDetails,
			duration: 10,
		});
	}

	/**
	 * Extract error message from various error formats
	 * @param {Error|string|Object} error - The error to extract a message from
	 * @returns {string} - The extracted error message
	 */
	static extractErrorMessage(error) {
		if (typeof error === 'string') return error;
		if (error.response?.data?.message) return error.response.data.message;
		if (error.response?.data?.error) return error.response.data.error;
		if (error.response?.data) {
			// If data is a string, return it
			if (typeof error.response.data === 'string') return error.response.data;
		}
		if (error.message) return error.message;
		return 'An unexpected error occurred';
	}

	/**
	 * Show success message
	 * @param {string} content - The success message content
	 * @param {number} duration - Duration in seconds (default: 3)
	 */
	static showSuccess(content, duration = 3) {
		message.success({ content, duration });
	}

	/**
	 * Show info message
	 * @param {string} content - The info message content
	 * @param {number} duration - Duration in seconds (default: 3)
	 */
	static showInfo(content, duration = 3) {
		message.info({ content, duration });
	}

	/**
	 * Show warning message
	 * @param {string} content - The warning message content
	 * @param {number} duration - Duration in seconds (default: 4)
	 */
	static showWarning(content, duration = 4) {
		message.warning({ content, duration });
	}

	/**
	 * Show error message
	 * @param {string} content - The error message content
	 * @param {number} duration - Duration in seconds (default: 5)
	 */
	static showError(content, duration = 5) {
		message.error({ content, duration });
	}
}

export default ErrorHandler;
