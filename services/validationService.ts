/**
 * Input validation utilities for client-side security
 * Provides comprehensive validation to prevent malicious input
 */

export class ValidationService {
  // Text validation patterns
  private static readonly TEXT_PATTERN = /^[a-zA-Z0-9\s\-.,!?()@:;'"&%$#*+=/\\[\]{}|~`]+$/;
  private static readonly NAME_PATTERN = /^[a-zA-Z\s\-']+$/;
  private static readonly ALPHA_NUMERIC_PATTERN = /^[a-zA-Z0-9\s\-_]+$/;

  // Length limits matching Firestore rules
  private static readonly MAX_DESCRIPTION_LENGTH = 60;
  private static readonly MAX_NAME_LENGTH = 60;
  private static readonly MAX_COMMENTS_LENGTH = 255;

  /**
   * Sanitizes text input by removing potentially dangerous characters
   */
  static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
      .trim()
      // Remove null bytes and control characters
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Remove potential script injection patterns
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      // Limit consecutive whitespace
      .replace(/\s{3,}/g, '  ')
      .slice(0, 1000); // Reasonable maximum length
  }

  /**
   * Validates polly description
   */
  static validatePollyDescription(description: string): { isValid: boolean; error?: string } {
    const sanitized = this.sanitizeText(description);

    if (!sanitized) {
      return { isValid: false, error: 'Description is required' };
    }

    if (sanitized.length > this.MAX_DESCRIPTION_LENGTH) {
      return { isValid: false, error: `Description must be ${this.MAX_DESCRIPTION_LENGTH} characters or less` };
    }

    if (!this.TEXT_PATTERN.test(sanitized)) {
      return { isValid: false, error: 'Description contains invalid characters' };
    }

    return { isValid: true };
  }

  /**
   * Validates driver/consumer name
   */
  static validateName(name: string): { isValid: boolean; error?: string } {
    const sanitized = this.sanitizeText(name);

    if (!sanitized) {
      return { isValid: false, error: 'Name is required' };
    }

    if (sanitized.length > this.MAX_NAME_LENGTH) {
      return { isValid: false, error: `Name must be ${this.MAX_NAME_LENGTH} characters or less` };
    }

    if (!this.NAME_PATTERN.test(sanitized)) {
      return { isValid: false, error: 'Name contains invalid characters. Only letters, spaces, hyphens, and apostrophes are allowed' };
    }

    return { isValid: true };
  }

  /**
   * Validates driver description/meeting details
   */
  static validateDescription(description: string): { isValid: boolean; error?: string } {
    const sanitized = this.sanitizeText(description);

    if (!sanitized) {
      return { isValid: false, error: 'Description is required' };
    }

    if (sanitized.length > this.MAX_COMMENTS_LENGTH) {
      return { isValid: false, error: `Description must be ${this.MAX_COMMENTS_LENGTH} characters or less` };
    }

    if (!this.TEXT_PATTERN.test(sanitized)) {
      return { isValid: false, error: 'Description contains invalid characters' };
    }

    return { isValid: true };
  }

  /**
   * Validates comments (optional field)
   */
  static validateComments(comments: string): { isValid: boolean; error?: string } {
    if (!comments || comments.trim() === '') {
      return { isValid: true }; // Comments are optional
    }

    const sanitized = this.sanitizeText(comments);

    if (sanitized.length > this.MAX_COMMENTS_LENGTH) {
      return { isValid: false, error: `Comments must be ${this.MAX_COMMENTS_LENGTH} characters or less` };
    }

    if (!this.TEXT_PATTERN.test(sanitized)) {
      return { isValid: false, error: 'Comments contain invalid characters' };
    }

    return { isValid: true };
  }

  /**
   * Validates number of spots
   */
  static validateSpots(spots: number): { isValid: boolean; error?: string } {
    if (typeof spots !== 'number' || isNaN(spots)) {
      return { isValid: false, error: 'Spots must be a valid number' };
    }

    if (!Number.isInteger(spots)) {
      return { isValid: false, error: 'Spots must be a whole number' };
    }

    if (spots < 1) {
      return { isValid: false, error: 'Spots must be at least 1' };
    }

    if (spots > 50) { // Reasonable upper limit
      return { isValid: false, error: 'Spots cannot exceed 50' };
    }

    return { isValid: true };
  }

  /**
   * Validates UUID format
   */
  static validateUUID(uuid: string): { isValid: boolean; error?: string } {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuid || typeof uuid !== 'string') {
      return { isValid: false, error: 'Invalid UUID format' };
    }

    if (!uuidPattern.test(uuid)) {
      return { isValid: false, error: 'Invalid UUID format' };
    }

    return { isValid: true };
  }

  /**
   * Rate limiting helper - tracks operation timestamps
   */
  private static operationTimestamps: Map<string, number[]> = new Map();

  static checkRateLimit(operation: string, maxOperations: number = 10, timeWindow: number = 60000): boolean {
    const now = Date.now();
    const timestamps = this.operationTimestamps.get(operation) || [];

    // Remove timestamps outside the time window
    const validTimestamps = timestamps.filter(timestamp => now - timestamp < timeWindow);

    if (validTimestamps.length >= maxOperations) {
      return false; // Rate limit exceeded
    }

    // Add current timestamp
    validTimestamps.push(now);
    this.operationTimestamps.set(operation, validTimestamps);

    return true;
  }

  /**
   * Show rate limit modal instead of alert
   */
  static showRateLimitModal(operation: string, maxOperations: number, timeWindow: number): void {
    // For React Native, we'll use Alert
    const { Alert } = require('react-native');
    Alert.alert(
      'Too Many Requests',
      `You've made too many ${operation} requests. Please wait ${Math.ceil(timeWindow / 1000)} seconds before trying again.\n\nRate limit: ${maxOperations} requests per ${Math.ceil(timeWindow / 1000)} seconds`,
      [{ text: 'OK' }]
    );
  }

  /**
   * Comprehensive form validation for driver creation
   */
  static validateDriverForm(name: string, description: string, spots: number): {
    isValid: boolean;
    errors: { name?: string; description?: string; spots?: string }
  } {
    const nameValidation = this.validateName(name);
    const descriptionValidation = this.validateDescription(description);
    const spotsValidation = this.validateSpots(spots);

    const errors: { name?: string; description?: string; spots?: string } = {};

    if (!nameValidation.isValid) errors.name = nameValidation.error;
    if (!descriptionValidation.isValid) errors.description = descriptionValidation.error;
    if (!spotsValidation.isValid) errors.spots = spotsValidation.error;

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Comprehensive form validation for consumer addition
   */
  static validateConsumerForm(name: string, comments: string = ''): {
    isValid: boolean;
    errors: { name?: string; comments?: string }
  } {
    const nameValidation = this.validateName(name);
    const commentsValidation = this.validateComments(comments);

    const errors: { name?: string; comments?: string } = {};

    if (!nameValidation.isValid) errors.name = nameValidation.error;
    if (!commentsValidation.isValid) errors.comments = commentsValidation.error;

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}