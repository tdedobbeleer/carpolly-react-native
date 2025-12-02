import Toast from 'react-native-simple-toast';

// Error types that indicate network/connectivity issues
const NETWORK_ERROR_CODES = [
  'network-request-failed',
  'unavailable',
  'deadline-exceeded',
  'resource-exhausted',
  'failed-precondition'
];

// Firebase error codes that typically indicate network issues
const FIREBASE_NETWORK_ERROR_CODES = [
  'unavailable',
  'deadline-exceeded',
  'resource-exhausted',
  'failed-precondition',
  'permission-denied', // Sometimes caused by network issues
  'unauthenticated' // Sometimes caused by network issues
];

interface ErrorContext {
  operation: string;
  entity?: string;
}

class ErrorService {
  /**
   * Shows a user-friendly toast message based on the error type
   */
  showUserFriendlyError(error: any, context: ErrorContext): void {
    const userMessage = this.getUserFriendlyMessage(error, context);
    Toast.showWithGravity(userMessage, Toast.LONG, Toast.BOTTOM);
    
    // Log the detailed error for debugging
    this.logErrorDetails(error, context);
  }

  /**
   * Determines if an error is related to network/connectivity issues
   */
  isNetworkError(error: any): boolean {
    // Check if it's a Firebase error
    if (error?.code) {
      return FIREBASE_NETWORK_ERROR_CODES.includes(error.code);
    }

    // Check for generic network errors
    const errorMessage = (error?.message || error?.toString() || '').toLowerCase();
    const errorName = (error?.name || '').toLowerCase();
    
    return NETWORK_ERROR_CODES.some(code => 
      errorMessage.includes(code) || errorName.includes(code)
    ) || this.looksLikeNetworkError(errorMessage);
  }

  /**
   * Gets a user-friendly error message
   */
  private getUserFriendlyMessage(error: any, context: ErrorContext): string {
    const { operation, entity } = context;
    const entityName = entity || 'item';
    
    // Check if it's a network/connectivity issue
    if (this.isNetworkError(error)) {
      return `Unable to ${operation.toLowerCase()} ${entityName}. Please check your internet connection and try again.`;
    }

    // Handle specific Firebase error codes
    if (error?.code) {
      switch (error.code) {
        case 'permission-denied':
          return `You don't have permission to ${operation.toLowerCase()} this ${entityName}.`;
        case 'not-found':
          return `The ${entityName} you're looking for could not be found.`;
        case 'already-exists':
          return `This ${entityName} already exists.`;
        case 'unauthenticated':
          return `Please sign in again to ${operation.toLowerCase()} ${entityName}.`;
        default:
          return `Failed to ${operation.toLowerCase()} ${entityName}. Please try again.`;
      }
    }

    // Generic fallback message
    return `Unable to ${operation.toLowerCase()} ${entityName}. Please check your connection and try again.`;
  }

  /**
   * Determines if an error message looks like a network error
   */
  private looksLikeNetworkError(errorMessage: string): boolean {
    const networkKeywords = [
      'network',
      'connection',
      'timeout',
      'offline',
      'unreachable',
      'econnreset',
      'econnrefused',
      'enotfound',
      'etimedout',
      'fetch',
      'request failed'
    ];

    return networkKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Logs detailed error information for debugging
   */
  private logErrorDetails(error: any, context: ErrorContext): void {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      operation: context.operation,
      entity: context.entity,
      error: {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
        toString: error?.toString()
      }
    };

    console.group(`🚨 Error Details - ${context.operation}`);
    console.error('Context:', context);
    console.error('Error Object:', error);
    console.error('Error Info:', errorInfo);
    console.groupEnd();

    // In development, you might want to send this to a logging service
    if (__DEV__) {
      // Additional debugging info for development
      console.group('🔍 Debug Information');
      console.error('Error Type:', typeof error);
      console.error('Error Keys:', Object.keys(error || {}));
      console.groupEnd();
    }
  }

  /**
   * Safely executes an async operation with error handling
   */
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    showToast: boolean = true
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      if (showToast) {
        this.showUserFriendlyError(error, context);
      }
      return null;
    }
  }

  /**
   * Validates network connectivity before attempting operations
   */
  async validateNetworkConnectivity(): Promise<boolean> {
    try {
      // Simple network test - you can replace this with a more sophisticated check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const errorService = new ErrorService();