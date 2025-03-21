import axios from 'axios';
import yelpService from '../services/yelp';

// Use global axios mock

describe('YelpService', () => {
  beforeEach(() => {
    // Clear all mock implementation
    jest.clearAllMocks();
  });

  it('should make a POST request to the Yelp AI API', async () => {
    // Mock implementation for this test
    const mockAxiosInstance = axios.create();
    (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
      data: {
        response: {
          text: 'Here are some restaurants in Chicago',
        },
        types: ['business_search'],
        entities: [
          {
            businesses: [
              {
                name: 'Test Restaurant',
                rating: 4.5,
                review_count: 100,
              },
            ],
          },
        ],
        chat_id: 'test-chat-id',
      },
    });

    const query = 'Find restaurants in Chicago';
    const result = await yelpService.chat(query);

    // Verify that the axios post method was called with the right arguments
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/ai/chat/v2', {
      query,
    });

    // Verify the structure of the response
    expect(result).toEqual({
      response: {
        text: 'Here are some restaurants in Chicago',
      },
      types: ['business_search'],
      entities: [
        {
          businesses: [
            {
              name: 'Test Restaurant',
              rating: 4.5,
              review_count: 100,
            },
          ],
        },
      ],
      chat_id: 'test-chat-id',
    });
  });

  it('should throw an error when the API call fails', async () => {
    // Mock a failed API call
    const mockAxiosInstance = axios.create();
    (mockAxiosInstance.post as jest.Mock).mockRejectedValueOnce(new Error('API error'));

    const query = 'Find restaurants in Chicago';
    
    // Expect the chat method to throw an error
    await expect(yelpService.chat(query)).rejects.toThrow('API error');
  });
});