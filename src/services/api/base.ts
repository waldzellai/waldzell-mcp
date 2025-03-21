import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Base API client for Yelp Fusion API
 */
export class BaseApiClient {
  protected apiKey: string;
  protected clientId: string;
  protected client: AxiosInstance;

  constructor() {
    this.apiKey = process.env.YELP_API_KEY || '';
    this.clientId = process.env.YELP_CLIENT_ID || '';

    if (!this.apiKey || !this.clientId) {
      throw new Error('YELP_API_KEY and YELP_CLIENT_ID must be set in .env file');
    }

    this.client = axios.create({
      baseURL: 'https://api.yelp.com',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      }
    });
  }

  /**
   * Make a GET request to the Yelp API
   */
  protected async get<T>(path: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get(path, { 
        ...config,
        params 
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Make a POST request to the Yelp API
   */
  protected async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post(path, data, config);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Make a PUT request to the Yelp API
   */
  protected async put<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put(path, data, config);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Make a DELETE request to the Yelp API
   */
  protected async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete(path, config);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: any): void {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      console.error(`Yelp API Error (${status}):`, data);
      
      // Enhance error with API response details
      error.message = `Yelp API Error (${status}): ${error.message}`;
      if (data?.error?.description) {
        error.message += ` - ${data.error.description}`;
      }
    } else {
      console.error('Yelp API Error:', error);
    }
  }
}