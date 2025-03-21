import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import claimBusinessClient from '../services/api/claim-business';
import {
  ClaimEligibility,
  ClaimResponse,
  ClaimStatus,
  VerificationResponse,
  DocumentUploadResponse
} from '../services/api/claim-business';

// Setup mock for axios
const mock = new MockAdapter(axios);

describe('Claim Business API Client', () => {
  // Reset mocks before each test
  beforeEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  // Sample data for tests
  const businessId = 'abc123';
  const claimId = 'claim_12345';

  const sampleEligibility: ClaimEligibility = {
    business_id: businessId,
    eligible: true,
    claim_status: 'unclaimed',
    available_methods: ['phone', 'email', 'document']
  };

  const sampleClaimRequest = {
    business_id: businessId,
    full_name: 'John Smith',
    email: 'john@example.com',
    phone: '555-123-4567',
    job_title: 'Owner',
    verification_method: 'phone',
    website_url: 'https://example.com',
    notes: 'I just opened this business last month'
  };

  const sampleClaimResponse: ClaimResponse = {
    claim_id: claimId,
    business_id: businessId,
    status: 'verification_needed',
    verification_method: 'phone',
    verification_code: '123456',
    verification_instructions: 'Please enter the code that was sent to your phone.',
    verification_expires_at: '2023-06-01T12:00:00Z',
    created_at: '2023-05-01T12:00:00Z',
    updated_at: '2023-05-01T12:00:00Z'
  };

  const sampleClaimStatus: ClaimStatus = {
    claim_id: claimId,
    business_id: businessId,
    status: 'pending',
    verification_method: 'phone',
    verification_completed: true,
    created_at: '2023-05-01T12:00:00Z',
    updated_at: '2023-05-01T12:00:00Z',
    next_steps: 'Your claim is being reviewed. This typically takes 1-3 business days.'
  };

  const sampleVerificationResponse: VerificationResponse = {
    claim_id: claimId,
    success: true,
    claim_status: 'pending',
    next_steps: 'Your verification was successful. Your claim is now being reviewed.'
  };

  const sampleDocumentUpload: DocumentUploadResponse = {
    upload_id: 'upload_12345',
    claim_id: claimId,
    status: 'pending',
    document_type: 'business_license',
    created_at: '2023-05-01T12:00:00Z'
  };

  describe('Check Eligibility', () => {
    it('should check business claim eligibility', async () => {
      mock.onGet(`/v3/businesses/${businessId}/claim/eligibility`).reply(200, sampleEligibility);

      const response = await claimBusinessClient.checkEligibility(businessId);
      expect(response).toEqual(sampleEligibility);
      expect(response.eligible).toBe(true);
      expect(response.claim_status).toBe('unclaimed');
    });

    it('should handle ineligible businesses', async () => {
      const ineligibleBusiness: ClaimEligibility = {
        business_id: businessId,
        eligible: false,
        claim_status: 'ineligible',
        ineligibility_reason: 'This business has already been claimed'
      };

      mock.onGet(`/v3/businesses/${businessId}/claim/eligibility`).reply(200, ineligibleBusiness);

      const response = await claimBusinessClient.checkEligibility(businessId);
      expect(response).toEqual(ineligibleBusiness);
      expect(response.eligible).toBe(false);
      expect(response.ineligibility_reason).toBeDefined();
    });
  });

  describe('Submit Claim', () => {
    it('should submit a business claim', async () => {
      mock.onPost('/v3/businesses/claim', sampleClaimRequest).reply(200, sampleClaimResponse);

      const response = await claimBusinessClient.submitClaim(sampleClaimRequest);
      expect(response).toEqual(sampleClaimResponse);
      expect(response.claim_id).toBe(claimId);
      expect(response.status).toBe('verification_needed');
      expect(response.verification_code).toBeDefined();
    });
  });

  describe('Get Claim Status', () => {
    it('should get the status of a claim', async () => {
      mock.onGet(`/v3/businesses/claim/${claimId}`).reply(200, sampleClaimStatus);

      const response = await claimBusinessClient.getClaimStatus(claimId);
      expect(response).toEqual(sampleClaimStatus);
      expect(response.claim_id).toBe(claimId);
      expect(response.business_id).toBe(businessId);
      expect(response.status).toBe('pending');
    });
  });

  describe('Verify Code', () => {
    it('should submit verification code', async () => {
      const verificationRequest = {
        claim_id: claimId,
        verification_code: '123456'
      };

      mock.onPost(`/v3/businesses/claim/${claimId}/verify`, { verification_code: '123456' }).reply(200, sampleVerificationResponse);

      const response = await claimBusinessClient.verifyCode(verificationRequest);
      expect(response).toEqual(sampleVerificationResponse);
      expect(response.success).toBe(true);
      expect(response.claim_status).toBe('pending');
    });

    it('should handle failed verification', async () => {
      const verificationRequest = {
        claim_id: claimId,
        verification_code: 'wrong-code'
      };

      const failedVerification: VerificationResponse = {
        claim_id: claimId,
        success: false,
        claim_status: 'verification_needed',
        error_message: 'Invalid verification code. Please try again.'
      };

      mock.onPost(`/v3/businesses/claim/${claimId}/verify`, { verification_code: 'wrong-code' }).reply(200, failedVerification);

      const response = await claimBusinessClient.verifyCode(verificationRequest);
      expect(response).toEqual(failedVerification);
      expect(response.success).toBe(false);
      expect(response.error_message).toBeDefined();
    });
  });

  describe('Upload Document', () => {
    it('should upload a document', async () => {
      // Create a mock file object
      const mockFile = Buffer.from('mock file content');
      const documentType = 'business_license';

      // The mock-adapter doesn't handle FormData well, so we'll just verify the path
      mock.onPost(`/v3/businesses/claim/${claimId}/documents`).reply(200, sampleDocumentUpload);

      const response = await claimBusinessClient.uploadDocument(claimId, documentType, mockFile);
      expect(response).toEqual(sampleDocumentUpload);
      expect(response.upload_id).toBeDefined();
      expect(response.status).toBe('pending');
    });
  });

  describe('Cancel Claim', () => {
    it('should cancel a claim', async () => {
      mock.onDelete(`/v3/businesses/claim/${claimId}`).reply(200, { success: true });

      const response = await claimBusinessClient.cancelClaim(claimId);
      expect(response).toEqual({ success: true });
    });
  });

  describe('Error handling', () => {
    it('should handle API errors', async () => {
      mock.onGet(`/v3/businesses/${businessId}/claim/eligibility`).reply(404, {
        error: {
          code: 'not_found',
          description: 'Business not found'
        }
      });

      await expect(claimBusinessClient.checkEligibility(businessId)).rejects.toThrow();
    });
  });
});