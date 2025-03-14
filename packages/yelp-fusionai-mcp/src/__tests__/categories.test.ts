import axios from 'axios';
import yelpService from '../services/yelp';
import { Category, CategoriesResponse } from '../services/api/categories';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

describe('Categories API', () => {
  beforeEach(() => {
    // Clear all mock implementation
    jest.clearAllMocks();
  });

  describe('Get All Categories', () => {
    it('should make a GET request to fetch all categories', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: CategoriesResponse = {
        categories: [
          {
            alias: 'restaurants',
            title: 'Restaurants',
            parent_aliases: []
          },
          {
            alias: 'italian',
            title: 'Italian',
            parent_aliases: ['restaurants'],
            parent_titles: ['Restaurants']
          },
          {
            alias: 'pizza',
            title: 'Pizza',
            parent_aliases: ['restaurants', 'italian'],
            parent_titles: ['Restaurants', 'Italian']
          }
        ]
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const result = await yelpService.categories.getAll();

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/categories', undefined);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should include locale and country parameters when provided', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: CategoriesResponse = {
        categories: [
          {
            alias: 'restaurants',
            title: 'Restaurants',
            parent_aliases: []
          }
        ]
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const params = {
        locale: 'fr_FR',
        country: 'FR'
      };
      const result = await yelpService.categories.getAll(params);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/categories', params);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Get Category Details', () => {
    it('should make a GET request to fetch category details', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: Category = {
        alias: 'italian',
        title: 'Italian',
        parent_aliases: ['restaurants'],
        parent_titles: ['Restaurants'],
        country_whitelist: ['US', 'CA', 'FR', 'IT'],
        country_blacklist: []
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const alias = 'italian';
      const result = await yelpService.categories.getCategory(alias);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/categories/italian', undefined);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should include locale and country parameters when provided', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: Category = {
        alias: 'italian',
        title: 'Italien',
        parent_aliases: ['restaurants'],
        parent_titles: ['Restaurants'],
        country_whitelist: ['US', 'CA', 'FR', 'IT'],
        country_blacklist: []
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const alias = 'italian';
      const params = {
        locale: 'fr_FR',
        country: 'FR'
      };
      const result = await yelpService.categories.getCategory(alias, params);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/categories/italian', params);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Search Categories', () => {
    it('should make a GET request to search for categories', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: CategoriesResponse = {
        categories: [
          {
            alias: 'pizza',
            title: 'Pizza',
            parent_aliases: ['restaurants', 'italian'],
            parent_titles: ['Restaurants', 'Italian']
          },
          {
            alias: 'italian_pizza',
            title: 'Italian Pizza',
            parent_aliases: ['restaurants', 'italian'],
            parent_titles: ['Restaurants', 'Italian']
          }
        ]
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const term = 'pizza';
      const result = await yelpService.categories.searchCategories(term);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/categories/search', {
        term: 'pizza'
      });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should include additional parameters when provided', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: CategoriesResponse = {
        categories: [
          {
            alias: 'pizza',
            title: 'Pizza',
            parent_aliases: ['restaurants', 'italian'],
            parent_titles: ['Restaurants', 'Italian']
          }
        ]
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const term = 'pizza';
      const params = {
        locale: 'fr_FR',
        country: 'FR'
      };
      const result = await yelpService.categories.searchCategories(term, params);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/categories/search', {
        term: 'pizza',
        locale: 'fr_FR',
        country: 'FR'
      });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });
});