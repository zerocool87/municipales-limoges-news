/**
 * HTTP fetch utilities with timeout and retry logic
 */

import fetch from 'node-fetch';
import { AbortController } from 'node-fetch';

/**
 * Fetch with automatic timeout
 * @param {string} url - URL to fetch
 * @param {object} options - fetch options
 * @param {number} timeoutMs - timeout in milliseconds (default 8000)
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Fetch with retry logic
 * @param {string} url - URL to fetch
 * @param {object} options - fetch options
 * @param {number} maxRetries - maximum number of retries (default 2)
 * @param {number} timeoutMs - timeout per attempt in milliseconds
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 2, timeoutMs = 8000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchWithTimeout(url, options, timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        // Exponential backoff: 100ms, 200ms, 400ms...
        const delay = 100 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Parse JSON with error handling
 * @param {Response} response - fetch response
 * @returns {Promise<object>}
 */
export async function parseJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`JSON parse error: ${error.message}. Response: ${text.slice(0, 100)}`);
  }
}
