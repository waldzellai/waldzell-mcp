import axios from 'axios';
import yelpService from '../services/yelp';
import { OAuthV2TokenResponse, OAuthV2RevokeResponse } from '../services/api/oauth/v2';
import { OAuthV3TokenResponse } from '../services/api/oauth/v3';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
}));

describe('OAuth API', () => {
  beforeEach(() => {
    // Clear all mock implementation
    jest.clearAllMocks();
  });

  describe('OAuth v2', () => {
    it('should get a token with v2 endpoint', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: OAuthV2TokenResponse = {
        access_token: 'abc123xyz789',
        token_type: 'Bearer',
        expires_in: 7200
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const clientId = 'test-client-id';
      const clientSecret = 'test-client-secret';
      const result = await yelpService.oauth.v2.getToken(clientId, clientSecret);

      // Verify request
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/oauth2/token', {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      });

      // Verify response
      expect(result).toEqual(mockResponse);
    });

    it('should revoke a token', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: OAuthV2RevokeResponse = {
        success: true,
        message: 'Token revoked successfully'
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const token = 'abc123xyz789';
      const result = await yelpService.oauth.v2.revokeToken(token);

      // Verify request
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/oauth2/revoke', {
        token
      });

      // Verify response
      expect(result).toEqual(mockResponse);
    });

    it('should verify a token', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse = {
        active: true,
        client_id: 'test-client-id',
        expires_in: 5400
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const token = 'abc123xyz789';
      const result = await yelpService.oauth.v2.verifyToken(token);

      // Verify request with custom headers
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/oauth2/token/info', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Verify response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('OAuth v3', () => {
    it('should get a token with v3 endpoint', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: OAuthV3TokenResponse = {
        access_token: 'abc123xyz789',
        token_type: 'Bearer',
        expires_in: 7200,
        refresh_token: 'refresh-123-456',
        scope: 'read_public write_public'
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const credentials = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };
      const result = await yelpService.oauth.v3.getToken(credentials);

      // Verify request
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/oauth2/v3/token', {
        grant_type: 'client_credentials',
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret
      });

      // Verify response
      expect(result).toEqual(mockResponse);
    });

    it('should refresh a token', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: OAuthV3TokenResponse = {
        access_token: 'new-token-123',
        token_type: 'Bearer',
        expires_in: 7200,
        refresh_token: 'new-refresh-456',
        scope: 'read_public write_public'
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const refreshToken = 'refresh-123-456';
      const scope = 'read_public write_public';
      const result = await yelpService.oauth.v3.refreshToken(refreshToken, scope);

      // Verify request
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/oauth2/v3/token', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope
      });

      // Verify response
      expect(result).toEqual(mockResponse);
    });

    it('should get token info', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse = {
        client_id: 'test-client-id',
        user_id: 'user123',
        active: true,
        expires_in: 5400,
        scope: 'read_public write_public'
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const token = 'abc123xyz789';
      const result = await yelpService.oauth.v3.getTokenInfo(token);

      // Verify request with custom headers
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/oauth2/v3/tokeninfo', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Verify response
      expect(result).toEqual(mockResponse);
    });

    it('should generate an authorization URL', () => {
      const clientId = 'test-client-id';
      const redirectUri = 'https://example.com/callback';
      const scopes = ['read_public', 'write_public'];
      const state = 'random-state-123';
      
      const url = yelpService.oauth.v3.getAuthorizationUrl(clientId, redirectUri, scopes, state);
      
      // Expected URL with properly encoded parameters
      const expectedUrl = '/oauth2/v3/authorize?response_type=code&client_id=test-client-id'
        + '&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback'
        + '&scope=read_public%20write_public'
        + '&state=random-state-123';
      
      expect(url).toEqual(expectedUrl);
    });
  });

  describe('Main OAuth client', () => {
    it('should provide a simplified getToken method using v3 by default', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: OAuthV3TokenResponse = {
        access_token: 'abc123xyz789',
        token_type: 'Bearer',
        expires_in: 7200,
        refresh_token: 'refresh-123-456'
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const credentials = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };
      const result = await yelpService.oauth.getToken(credentials);

      // Verify that it calls the v3 method
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/oauth2/v3/token', {
        grant_type: 'client_credentials',
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret
      });

      // Verify response
      expect(result).toEqual(mockResponse);
    });
  });
});