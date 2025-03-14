import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import yelpService from '../services/yelp';
import { 
  Lead, 
  LeadListResponse, 
  LeadNote,
  LeadNoteListResponse,
  LeadActivity,
  LeadActivityListResponse,
  BulkOperationResponse,
  ImportLeadsResponse,
  ExportLeadsResponse,
  ExportJobStatusResponse,
  LeadStatistics
} from '../services/api/leads';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('Leads API', () => {
  beforeEach(() => {
    // Clear all mock implementation
    jest.clearAllMocks();
  });

  describe('Get Leads', () => {
    it('should make a GET request to fetch leads', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: LeadListResponse = {
        leads: [
          {
            id: 'lead1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+14155550123',
            company: 'ABC Corp',
            job_title: 'Marketing Director',
            status: 'new',
            priority: 'medium',
            source: 'website',
            estimated_value_cents: 50000,
            created_at: '2023-06-15T10:30:00Z',
            updated_at: '2023-06-15T10:30:00Z'
          },
          {
            id: 'lead2',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            company: 'XYZ Inc',
            status: 'contacted',
            priority: 'high',
            source: 'referral',
            created_at: '2023-06-14T09:15:00Z',
            updated_at: '2023-06-15T11:20:00Z',
            last_contacted_at: '2023-06-15T11:20:00Z'
          }
        ],
        pagination: {
          total: 42,
          page: 1,
          per_page: 20
        }
      };
      
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const result = await yelpService.leads.getLeads();

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/leads', undefined);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should include search parameters when provided', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: LeadListResponse = {
        leads: [
          {
            id: 'lead2',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            company: 'XYZ Inc',
            status: 'contacted',
            priority: 'high',
            source: 'referral',
            created_at: '2023-06-14T09:15:00Z',
            updated_at: '2023-06-15T11:20:00Z',
            last_contacted_at: '2023-06-15T11:20:00Z'
          }
        ],
        pagination: {
          total: 5,
          page: 1,
          per_page: 20
        }
      };
      
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const searchParams = {
        status: 'contacted' as const,
        priority: 'high' as const,
        sort_by: 'updated_at' as const,
        sort_order: 'desc' as const
      };
      
      const result = await yelpService.leads.getLeads(searchParams);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/leads', searchParams);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Get Lead Details', () => {
    it('should make a GET request to fetch a specific lead', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: Lead = {
        id: 'lead1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+14155550123',
        company: 'ABC Corp',
        job_title: 'Marketing Director',
        status: 'new',
        priority: 'medium',
        source: 'website',
        estimated_value_cents: 50000,
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94105',
          country: 'US'
        },
        notes: 'Initial contact from website form',
        business_id: 'biz123',
        owner_id: 'user456',
        tags: ['marketing', 'enterprise'],
        created_at: '2023-06-15T10:30:00Z',
        updated_at: '2023-06-15T10:30:00Z'
      };
      
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const leadId = 'lead1';
      const result = await yelpService.leads.getLead(leadId);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/leads/lead1', undefined);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Create Lead', () => {
    it('should make a POST request to create a new lead', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: Lead = {
        id: 'lead3',
        name: 'Robert Johnson',
        email: 'robert.johnson@example.com',
        phone: '+14155551234',
        company: 'Johnson LLC',
        job_title: 'CEO',
        status: 'new',
        priority: 'high',
        source: 'advertisement',
        estimated_value_cents: 100000,
        tags: ['executive', 'decision-maker'],
        created_at: '2023-06-16T14:25:00Z',
        updated_at: '2023-06-16T14:25:00Z'
      };
      
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const createParams = {
        name: 'Robert Johnson',
        email: 'robert.johnson@example.com',
        phone: '+14155551234',
        company: 'Johnson LLC',
        job_title: 'CEO',
        priority: 'high',
        source: 'advertisement',
        estimated_value_cents: 100000,
        tags: ['executive', 'decision-maker']
      };
      
      const result = await yelpService.leads.createLead(createParams);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/leads', createParams);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Update Lead', () => {
    it('should make a PUT request to update a lead', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: Lead = {
        id: 'lead1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+14155550123',
        company: 'ABC Corp',
        job_title: 'Marketing Director',
        status: 'qualified',
        priority: 'high',
        source: 'website',
        estimated_value_cents: 75000,
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94105',
          country: 'US'
        },
        notes: 'Initial contact from website form. Meeting scheduled for next week.',
        business_id: 'biz123',
        owner_id: 'user456',
        tags: ['marketing', 'enterprise', 'qualified'],
        created_at: '2023-06-15T10:30:00Z',
        updated_at: '2023-06-17T09:45:00Z'
      };
      
      (mockAxiosInstance.put as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const leadId = 'lead1';
      const updateParams = {
        status: 'qualified' as const,
        priority: 'high' as const,
        estimated_value_cents: 75000,
        notes: 'Initial contact from website form. Meeting scheduled for next week.',
        tags: ['marketing', 'enterprise', 'qualified']
      };
      
      const result = await yelpService.leads.updateLead(leadId, updateParams);

      // Verify that the axios put method was called with the right arguments
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v3/leads/lead1', updateParams);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Delete Lead', () => {
    it('should make a DELETE request to delete a lead', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse = { success: true };
      
      (mockAxiosInstance.delete as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const leadId = 'lead2';
      const result = await yelpService.leads.deleteLead(leadId);

      // Verify that the axios delete method was called with the right arguments
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/v3/leads/lead2');

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Lead Notes', () => {
    it('should make a GET request to fetch lead notes', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: LeadNoteListResponse = {
        notes: [
          {
            id: 'note1',
            lead_id: 'lead1',
            content: 'Initial call completed. Client interested in premium package.',
            created_by: 'user456',
            created_at: '2023-06-15T15:30:00Z',
            updated_at: '2023-06-15T15:30:00Z'
          },
          {
            id: 'note2',
            lead_id: 'lead1',
            content: 'Sent follow-up email with pricing information.',
            created_by: 'user456',
            created_at: '2023-06-16T10:15:00Z',
            updated_at: '2023-06-16T10:15:00Z'
          }
        ],
        pagination: {
          total: 2,
          page: 1,
          per_page: 20
        }
      };
      
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const leadId = 'lead1';
      const result = await yelpService.leads.getLeadNotes(leadId);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/leads/lead1/notes', {});

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a POST request to add a lead note', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: LeadNote = {
        id: 'note3',
        lead_id: 'lead1',
        content: 'Meeting scheduled for next Monday at 2pm.',
        created_by: 'user456',
        created_at: '2023-06-17T11:45:00Z',
        updated_at: '2023-06-17T11:45:00Z'
      };
      
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const leadId = 'lead1';
      const noteParams = {
        content: 'Meeting scheduled for next Monday at 2pm.'
      };
      
      const result = await yelpService.leads.addLeadNote(leadId, noteParams);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/leads/lead1/notes', noteParams);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a DELETE request to delete a lead note', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse = { success: true };
      
      (mockAxiosInstance.delete as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const leadId = 'lead1';
      const noteId = 'note2';
      const result = await yelpService.leads.deleteLeadNote(leadId, noteId);

      // Verify that the axios delete method was called with the right arguments
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/v3/leads/lead1/notes/note2');

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Lead Activities', () => {
    it('should make a GET request to fetch lead activities', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: LeadActivityListResponse = {
        activities: [
          {
            id: 'activity1',
            lead_id: 'lead1',
            type: 'email',
            description: 'Sent initial outreach email',
            created_by: 'user456',
            created_at: '2023-06-15T14:30:00Z'
          },
          {
            id: 'activity2',
            lead_id: 'lead1',
            type: 'call',
            description: 'Initial discovery call',
            details: {
              duration_minutes: 30,
              outcome: 'positive'
            },
            created_by: 'user456',
            created_at: '2023-06-16T10:00:00Z'
          }
        ],
        pagination: {
          total: 2,
          page: 1,
          per_page: 20
        }
      };
      
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const leadId = 'lead1';
      const result = await yelpService.leads.getLeadActivities(leadId);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/leads/lead1/activities', {});

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a POST request to add a lead activity', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: LeadActivity = {
        id: 'activity3',
        lead_id: 'lead1',
        type: 'meeting',
        description: 'Product demo meeting',
        details: {
          duration_minutes: 60,
          location: 'Zoom',
          attendees: 3
        },
        created_by: 'user456',
        created_at: '2023-06-17T14:00:00Z'
      };
      
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const leadId = 'lead1';
      const activityParams = {
        type: 'meeting' as const,
        description: 'Product demo meeting',
        details: {
          duration_minutes: 60,
          location: 'Zoom',
          attendees: 3
        }
      };
      
      const result = await yelpService.leads.addLeadActivity(leadId, activityParams);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/leads/lead1/activities', activityParams);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Bulk Operations', () => {
    it('should make a POST request to update leads in bulk', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: BulkOperationResponse = {
        success_count: 2,
        failure_count: 1,
        failures: [
          {
            id: 'lead3',
            error: 'Lead not found'
          }
        ]
      };
      
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const bulkUpdateParams = {
        lead_ids: ['lead1', 'lead2', 'lead3'],
        updates: {
          status: 'contacted' as const,
          tags: ['follow-up', 'priority']
        }
      };
      
      const result = await yelpService.leads.bulkUpdateLeads(bulkUpdateParams);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/leads/bulk/update', bulkUpdateParams);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a POST request to delete leads in bulk', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: BulkOperationResponse = {
        success_count: 3,
        failure_count: 0
      };
      
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const bulkDeleteParams = {
        lead_ids: ['lead4', 'lead5', 'lead6']
      };
      
      const result = await yelpService.leads.bulkDeleteLeads(bulkDeleteParams);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/leads/bulk/delete', bulkDeleteParams);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Import and Export', () => {
    it('should make a POST request to import leads', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ImportLeadsResponse = {
        imported_count: 2,
        skipped_count: 1,
        failure_count: 1,
        imported_ids: ['lead7', 'lead8'],
        failures: [
          {
            index: 3,
            error: 'Missing required field: email'
          }
        ]
      };
      
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const importParams = {
        leads: [
          {
            name: 'Alice Brown',
            email: 'alice.brown@example.com',
            source: 'event' as const
          },
          {
            name: 'Bob Green',
            email: 'bob.green@example.com',
            source: 'referral' as const
          },
          {
            name: 'Carol White',
            email: 'carol.white@example.com',
            source: 'website' as const
          },
          {
            name: 'Dave Black',
            // Missing email
            source: 'advertisement' as const
          }
        ],
        skip_duplicates: true
      };
      
      const result = await yelpService.leads.importLeads(importParams);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/leads/import', importParams);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a POST request to export leads', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ExportLeadsResponse = {
        export_job_id: 'export1',
        status: 'pending',
        estimated_time_seconds: 120
      };
      
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const exportParams = {
        status: ['qualified', 'converted'] as any,
        created_after: '2023-01-01T00:00:00Z',
        format: 'csv' as const,
        fields: ['name', 'email', 'company', 'status', 'created_at']
      };
      
      const result = await yelpService.leads.exportLeads(exportParams);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/leads/export', exportParams);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a GET request to check export status', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ExportJobStatusResponse = {
        export_job_id: 'export1',
        status: 'completed',
        download_url: 'https://api.yelp.com/v3/leads/exports/export1/download',
        format: 'csv',
        lead_count: 42,
        expires_at: '2023-06-24T15:30:00Z'
      };
      
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const exportJobId = 'export1';
      const result = await yelpService.leads.getExportStatus(exportJobId);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/leads/export/export1', undefined);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Lead Statistics', () => {
    it('should make a GET request to fetch lead statistics', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: LeadStatistics = {
        total_count: 156,
        status_counts: {
          new: 45,
          contacted: 32,
          qualified: 28,
          converted: 36,
          lost: 15
        },
        source_counts: {
          website: 78,
          referral: 25,
          advertisement: 18,
          social_media: 22,
          event: 10,
          other: 3
        },
        priority_counts: {
          low: 38,
          medium: 85,
          high: 33
        },
        owner_counts: {
          'user456': 52,
          'user789': 48,
          'user101': 56
        },
        average_value_cents: 6248500,
        conversion_rate: {
          overall: 23.1,
          by_source: {
            website: 18.2,
            referral: 32.0,
            advertisement: 22.2,
            social_media: 27.3,
            event: 30.0,
            other: 33.3
          }
        },
        time_stats: {
          new_leads_last_30_days: 37,
          conversions_last_30_days: 8,
          average_time_to_contact_hours: 3.5,
          average_time_to_conversion_days: 14.2
        }
      };
      
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const timeframe = 'last_30_days';
      const result = await yelpService.leads.getLeadStatistics(timeframe);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/leads/statistics', { timeframe: 'last_30_days' });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });
});