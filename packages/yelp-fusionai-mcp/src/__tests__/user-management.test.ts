import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import userManagementClient from '../services/api/user-management';
import {
  UserProfile,
  UserPreferences,
  Friend,
  FriendsResponse,
  Collection,
  CollectionsResponse,
  CollectionItem,
  CollectionItemsResponse
} from '../services/api/user-management';

// Setup mock for axios
const mock = new MockAdapter(axios);

describe('User Management API Client', () => {
  // Reset mocks before each test
  beforeEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  // Sample data for tests
  const sampleUserProfile: UserProfile = {
    user_id: 'user123',
    name: 'John Smith',
    email: 'john@example.com',
    image_url: 'https://example.com/user.jpg',
    location: {
      city: 'San Francisco',
      state_code: 'CA',
      country_code: 'US',
      zip_code: '94107'
    },
    joined_date: '2020-01-15T12:00:00Z',
    review_count: 42,
    photo_count: 15,
    elite_years: [2021, 2022],
    social_stats: {
      friends: 120,
      compliments: 85,
      fans: 30
    },
    metrics: {
      average_rating: 4.2,
      rating_distribution: {
        '1': 2,
        '2': 5,
        '3': 8,
        '4': 15,
        '5': 12
      }
    }
  };

  const sampleUserPreferences: UserPreferences = {
    user_id: 'user123',
    display_preferences: {
      language: 'en_US',
      currency: 'USD',
      distance_unit: 'mi'
    },
    email_preferences: {
      promotional: true,
      friend_activity: true,
      review_comments: true,
      direct_messages: false
    },
    push_preferences: {
      promotional: false,
      friend_activity: true,
      review_comments: true,
      direct_messages: true
    },
    search_preferences: {
      default_location: 'San Francisco, CA',
      default_radius: 8000,
      price_filter: [2, 3],
      cuisine_preferences: ['italian', 'japanese', 'mexican']
    }
  };

  const sampleFriend: Friend = {
    user_id: 'friend123',
    name: 'Jane Doe',
    image_url: 'https://example.com/jane.jpg',
    location: 'New York, NY',
    review_count: 28,
    elite_years: [2022],
    friend_since: '2021-03-15T12:00:00Z'
  };

  const sampleFriendsResponse: FriendsResponse = {
    friends: [sampleFriend],
    total: 1
  };

  const sampleCollection: Collection = {
    collection_id: 'collection123',
    name: 'My Favorite Restaurants',
    description: 'Places I love to eat',
    cover_image_url: 'https://example.com/collection.jpg',
    item_count: 5,
    user_id: 'user123',
    is_public: true,
    created_at: '2022-01-15T12:00:00Z',
    updated_at: '2022-03-15T12:00:00Z'
  };

  const sampleCollectionsResponse: CollectionsResponse = {
    collections: [sampleCollection],
    total: 1
  };

  const sampleCollectionItem: CollectionItem = {
    item_id: 'item123',
    business_id: 'business123',
    business_name: 'Tasty Restaurant',
    business_image_url: 'https://example.com/restaurant.jpg',
    note: 'Great pasta dishes',
    added_at: '2022-02-15T12:00:00Z'
  };

  const sampleCollectionItemsResponse: CollectionItemsResponse = {
    collection_id: 'collection123',
    name: 'My Favorite Restaurants',
    items: [sampleCollectionItem],
    total: 1
  };

  describe('User Profile', () => {
    it('should get current user profile', async () => {
      mock.onGet('/v3/users/me').reply(200, sampleUserProfile);

      const response = await userManagementClient.getCurrentUserProfile();
      expect(response).toEqual(sampleUserProfile);
      expect(response.name).toBe('John Smith');
      expect(response.user_id).toBe('user123');
    });

    it('should get user profile by ID', async () => {
      mock.onGet('/v3/users/user123').reply(200, sampleUserProfile);

      const response = await userManagementClient.getUserProfile('user123');
      expect(response).toEqual(sampleUserProfile);
      expect(response.name).toBe('John Smith');
      expect(response.review_count).toBe(42);
    });

    it('should update user profile', async () => {
      const updates = {
        name: 'John D. Smith',
        location: {
          city: 'Oakland',
          state_code: 'CA',
          country_code: 'US',
          zip_code: '94610'
        }
      };

      const updatedProfile = {
        ...sampleUserProfile,
        name: 'John D. Smith',
        location: {
          city: 'Oakland',
          state_code: 'CA',
          country_code: 'US',
          zip_code: '94610'
        }
      };

      mock.onPut('/v3/users/me', updates).reply(200, updatedProfile);

      const response = await userManagementClient.updateUserProfile(updates);
      expect(response).toEqual(updatedProfile);
      expect(response.name).toBe('John D. Smith');
      expect(response.location?.city).toBe('Oakland');
    });
  });

  describe('User Preferences', () => {
    it('should get user preferences', async () => {
      mock.onGet('/v3/users/me/preferences').reply(200, sampleUserPreferences);

      const response = await userManagementClient.getUserPreferences();
      expect(response).toEqual(sampleUserPreferences);
      expect(response.display_preferences?.language).toBe('en_US');
      expect(response.search_preferences?.default_location).toBe('San Francisco, CA');
    });

    it('should update user preferences', async () => {
      const updates = {
        user_id: 'me',
        display_preferences: {
          language: 'en_US',
          currency: 'EUR',
          distance_unit: 'km'
        },
        email_preferences: {
          promotional: false
        }
      };

      const updatedPreferences = {
        ...sampleUserPreferences,
        display_preferences: {
          ...sampleUserPreferences.display_preferences,
          currency: 'EUR',
          distance_unit: 'km'
        },
        email_preferences: {
          ...sampleUserPreferences.email_preferences,
          promotional: false
        }
      };

      mock.onPut('/v3/users/me/preferences', updates).reply(200, updatedPreferences);

      const response = await userManagementClient.updateUserPreferences(updates);
      expect(response.display_preferences?.currency).toBe('EUR');
      expect(response.display_preferences?.distance_unit).toBe('km');
      expect(response.email_preferences?.promotional).toBe(false);
    });
  });

  describe('Friends', () => {
    it('should get current user friends', async () => {
      mock.onGet('/v3/users/me/friends').reply(200, sampleFriendsResponse);

      const response = await userManagementClient.getFriends();
      expect(response).toEqual(sampleFriendsResponse);
      expect(response.friends.length).toBe(1);
      expect(response.friends[0].name).toBe('Jane Doe');
    });

    it('should get friends for a specific user', async () => {
      mock.onGet('/v3/users/user123/friends').reply(200, sampleFriendsResponse);

      const response = await userManagementClient.getFriends('user123');
      expect(response).toEqual(sampleFriendsResponse);
      expect(response.friends.length).toBe(1);
    });

    it('should handle pagination parameters', async () => {
      mock.onGet('/v3/users/me/friends', { params: { limit: 10, offset: 20 } }).reply(200, sampleFriendsResponse);

      const response = await userManagementClient.getFriends('me', 10, 20);
      expect(response).toEqual(sampleFriendsResponse);
    });
  });

  describe('Collections', () => {
    it('should get user collections', async () => {
      mock.onGet('/v3/users/me/collections').reply(200, sampleCollectionsResponse);

      const response = await userManagementClient.getCollections();
      expect(response).toEqual(sampleCollectionsResponse);
      expect(response.collections.length).toBe(1);
      expect(response.collections[0].name).toBe('My Favorite Restaurants');
    });

    it('should get a single collection by ID', async () => {
      mock.onGet('/v3/collections/collection123').reply(200, sampleCollection);

      const response = await userManagementClient.getCollection('collection123');
      expect(response).toEqual(sampleCollection);
      expect(response.name).toBe('My Favorite Restaurants');
      expect(response.item_count).toBe(5);
    });

    it('should create a new collection', async () => {
      const newCollection = {
        name: 'New Food Spots',
        description: 'Places to try',
        is_public: false
      };

      const createdCollection = {
        ...sampleCollection,
        collection_id: 'new123',
        name: 'New Food Spots',
        description: 'Places to try',
        is_public: false,
        item_count: 0
      };

      mock.onPost('/v3/collections', newCollection).reply(200, createdCollection);

      const response = await userManagementClient.createCollection(
        newCollection.name,
        newCollection.description,
        newCollection.is_public
      );
      
      expect(response.collection_id).toBe('new123');
      expect(response.name).toBe('New Food Spots');
      expect(response.is_public).toBe(false);
    });

    it('should update a collection', async () => {
      const updates = {
        name: 'Updated Collection Name',
        is_public: true
      };

      const updatedCollection = {
        ...sampleCollection,
        name: 'Updated Collection Name'
      };

      mock.onPut('/v3/collections/collection123', updates).reply(200, updatedCollection);

      const response = await userManagementClient.updateCollection(
        'collection123',
        updates.name,
        undefined,
        updates.is_public
      );
      
      expect(response.name).toBe('Updated Collection Name');
    });

    it('should delete a collection', async () => {
      mock.onDelete('/v3/collections/collection123').reply(200, { success: true });

      const response = await userManagementClient.deleteCollection('collection123');
      expect(response).toEqual({ success: true });
    });
  });

  describe('Collection Items', () => {
    it('should get collection items', async () => {
      mock.onGet('/v3/collections/collection123/items').reply(200, sampleCollectionItemsResponse);

      const response = await userManagementClient.getCollectionItems('collection123');
      expect(response).toEqual(sampleCollectionItemsResponse);
      expect(response.items.length).toBe(1);
      expect(response.items[0].business_name).toBe('Tasty Restaurant');
    });

    it('should add a business to a collection', async () => {
      const request = {
        business_id: 'business456',
        note: 'Great cocktails'
      };

      const addedItem = {
        item_id: 'newitem123',
        business_id: 'business456',
        business_name: 'Cocktail Bar',
        added_at: '2023-01-15T12:00:00Z',
        note: 'Great cocktails'
      };

      mock.onPost('/v3/collections/collection123/items', { business_id: 'business456', note: 'Great cocktails' }).reply(200, addedItem);

      const response = await userManagementClient.addBusinessToCollection('collection123', request.business_id, request.note);
      expect(response.item_id).toBe('newitem123');
      expect(response.business_id).toBe('business456');
      expect(response.note).toBe('Great cocktails');
    });

    it('should remove a business from a collection', async () => {
      mock.onDelete('/v3/collections/collection123/items/item123').reply(200, { success: true });

      const response = await userManagementClient.removeBusinessFromCollection('collection123', 'item123');
      expect(response).toEqual({ success: true });
    });
  });

  describe('Error handling', () => {
    it('should handle API errors', async () => {
      mock.onGet('/v3/users/me').reply(401, {
        error: {
          code: 'unauthorized',
          description: 'Authentication required'
        }
      });

      await expect(userManagementClient.getCurrentUserProfile()).rejects.toThrow();
    });
  });
});