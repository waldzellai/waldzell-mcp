/**
 * Type definitions for the Yelp Fusion API
 */

export interface GetAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface GetBusinessesResponse {
  businesses: Business[];
  total: number;
  region?: Region;
}

export interface Business {
  id: string;
  alias: string;
  name: string;
  image_url?: string;
  is_closed?: boolean;
  url?: string;
  review_count: number;
  categories: Category[];
  rating: number;
  coordinates?: Coordinates;
  transactions?: string[];
  price?: string;
  location?: Location;
  phone?: string;
  display_phone?: string;
  distance?: number;
  [key: string]: any;
}

export interface Category {
  alias: string;
  title: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  zip_code?: string;
  country?: string;
  state?: string;
  display_address: string[];
}

export interface Region {
  center: Coordinates;
}

export interface RespondToReviewResponse {
  id?: string;
  text?: string;
  created_time?: string;
  success?: boolean;
  message?: string;
  [key: string]: any;
}

export interface YelpAIResponse {
  businesses?: Business[];
  explanation?: string;
  output?: string;
  [key: string]: any;
}

// The interface that our service should implement
export interface YelpServiceInterface {
  chat: (query: string) => Promise<YelpAIResponse>;
  
  businesses: {
    search: (params: any) => Promise<any>;
    getDetails: (id: string, params?: any) => Promise<any>;
    getReviews: (id: string, params?: any) => Promise<any>;
  };
  
  reviews: {
    getHighlights: (id: string, params?: any) => Promise<any>;
  };
  
  categories: {
    getAll: (params?: any) => Promise<any>;
    getDetails: (alias: string, params?: any) => Promise<any>;
  };
  
  events: {
    search: (params: any) => Promise<any>;
    getDetails: (id: string, params?: any) => Promise<any>;
    getFeatured: (params: any) => Promise<any>;
  };
  
  oauth: {
    v2: {
      getToken: (clientId: string, clientSecret: string) => Promise<any>;
      verifyToken: (token: string) => Promise<any>;
    };
    v3: {
      getToken: (params: any) => Promise<any>;
      getTokenInfo: (token: string) => Promise<any>;
    };
    refreshToken: (refreshToken: string) => Promise<any>;
    revokeToken: (token: string) => Promise<any>;
  };
  
  waitlistPartner: {
    getPartnerRestaurants: (params: any) => Promise<any>;
    getWaitlistStatus: (businessId: string) => Promise<any>;
    getWaitlistInfo: (businessId: string) => Promise<any>;
    joinQueue: (params: any) => Promise<any>;
    createOnMyWay: (visitId: string, params: any) => Promise<any>;
    cancelVisit: (visitId: string) => Promise<any>;
    getVisitDetails: (visitId: string) => Promise<any>;
  };
  
  respondReviews: {
    getAccessToken: (params: any) => Promise<GetAccessTokenResponse>;
    getBusinesses: (accessToken: string) => Promise<GetBusinessesResponse>;
    getBusinessOwnerInfo: (accessToken: string, businessId: string) => Promise<any>;
    respondToReview: (accessToken: string, reviewId: string, text: string) => Promise<RespondToReviewResponse>;
  };
  
  advertising: {
    createProgram: (params: any) => Promise<any>;
    listPrograms: (businessId: string, status?: string) => Promise<any>;
    getProgram: (programId: string) => Promise<any>;
    modifyProgram: (programId: string, params: any) => Promise<any>;
    getProgramStatus: (programId: string) => Promise<any>;
    pauseProgram: (programId: string) => Promise<any>;
    resumeProgram: (programId: string) => Promise<any>;
    terminateProgram: (programId: string) => Promise<any>;
  };
}