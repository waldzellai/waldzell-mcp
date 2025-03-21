import { BaseApiClient } from '../base';

/**
 * Claim eligibility status interface
 */
export interface ClaimEligibility {
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Is business eligible for claiming
   */
  eligible: boolean;
  
  /**
   * Claim status (if applicable)
   */
  claim_status?: 'unclaimed' | 'claimed' | 'pending' | 'ineligible';
  
  /**
   * Reason code for ineligibility (if applicable)
   */
  ineligibility_reason?: string;
  
  /**
   * Additional information about eligibility
   */
  details?: string;
  
  /**
   * Available claim methods
   */
  available_methods?: ('phone' | 'email' | 'mail' | 'document')[];
}

/**
 * Claim request interface
 */
export interface ClaimRequest {
  /**
   * Business ID to claim
   */
  business_id: string;
  
  /**
   * Full name of the business owner or authorized representative
   */
  full_name: string;
  
  /**
   * Email address
   */
  email: string;
  
  /**
   * Phone number
   */
  phone: string;
  
  /**
   * Job title or role at the business
   */
  job_title?: string;
  
  /**
   * Preferred verification method
   */
  verification_method?: 'phone' | 'email' | 'mail' | 'document';
  
  /**
   * Business website URL
   */
  website_url?: string;
  
  /**
   * Additional notes or comments
   */
  notes?: string;
}

/**
 * Claim response interface
 */
export interface ClaimResponse {
  /**
   * Claim ID
   */
  claim_id: string;
  
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Claim status
   */
  status: 'pending' | 'approved' | 'rejected' | 'verification_needed';
  
  /**
   * Verification method selected
   */
  verification_method: 'phone' | 'email' | 'mail' | 'document';
  
  /**
   * Verification code (if applicable)
   */
  verification_code?: string;
  
  /**
   * Instructions for verification
   */
  verification_instructions?: string;
  
  /**
   * Expiration date for verification (ISO 8601 format)
   */
  verification_expires_at?: string;
  
  /**
   * Created date (ISO 8601 format)
   */
  created_at: string;
  
  /**
   * Last updated date (ISO 8601 format)
   */
  updated_at: string;
}

/**
 * Verification request interface
 */
export interface VerificationRequest {
  /**
   * Claim ID to verify
   */
  claim_id: string;
  
  /**
   * Verification code provided by the user
   */
  verification_code: string;
}

/**
 * Verification response interface
 */
export interface VerificationResponse {
  /**
   * Claim ID
   */
  claim_id: string;
  
  /**
   * Verification success status
   */
  success: boolean;
  
  /**
   * New claim status after verification attempt
   */
  claim_status: 'pending' | 'approved' | 'rejected' | 'verification_needed';
  
  /**
   * Error message if verification failed
   */
  error_message?: string;
  
  /**
   * Next steps instructions
   */
  next_steps?: string;
}

/**
 * Document upload response
 */
export interface DocumentUploadResponse {
  /**
   * Upload ID
   */
  upload_id: string;
  
  /**
   * Claim ID
   */
  claim_id: string;
  
  /**
   * Upload status
   */
  status: 'pending' | 'approved' | 'rejected';
  
  /**
   * Document type
   */
  document_type: 'business_license' | 'utility_bill' | 'tax_document' | 'other';
  
  /**
   * Created date (ISO 8601 format)
   */
  created_at: string;
}

/**
 * Claim status interface
 */
export interface ClaimStatus {
  /**
   * Claim ID
   */
  claim_id: string;
  
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Current status
   */
  status: 'pending' | 'approved' | 'rejected' | 'verification_needed';
  
  /**
   * Detailed status message
   */
  status_message?: string;
  
  /**
   * Verification method used
   */
  verification_method: 'phone' | 'email' | 'mail' | 'document';
  
  /**
   * Is verification completed
   */
  verification_completed: boolean;
  
  /**
   * Created date (ISO 8601 format)
   */
  created_at: string;
  
  /**
   * Last updated date (ISO 8601 format)
   */
  updated_at: string;
  
  /**
   * Decision date (ISO 8601 format, if applicable)
   */
  decision_date?: string;
  
  /**
   * Next steps instructions
   */
  next_steps?: string;
}

/**
 * Claim Business API Client
 */
export class ClaimBusinessClient extends BaseApiClient {
  /**
   * Check if a business is eligible for claiming
   * 
   * @param businessId Business ID to check
   * @returns Promise with claim eligibility information
   */
  async checkEligibility(businessId: string): Promise<ClaimEligibility> {
    return this.get<ClaimEligibility>(`/v3/businesses/${businessId}/claim/eligibility`);
  }
  
  /**
   * Submit a claim for a business
   * 
   * @param request Claim request data
   * @returns Promise with claim response
   */
  async submitClaim(request: ClaimRequest): Promise<ClaimResponse> {
    return this.post<ClaimResponse>('/v3/businesses/claim', request);
  }
  
  /**
   * Get status of a claim
   * 
   * @param claimId Claim ID
   * @returns Promise with claim status
   */
  async getClaimStatus(claimId: string): Promise<ClaimStatus> {
    return this.get<ClaimStatus>(`/v3/businesses/claim/${claimId}`);
  }
  
  /**
   * Submit verification code for a claim
   * 
   * @param request Verification request data
   * @returns Promise with verification response
   */
  async verifyCode(request: VerificationRequest): Promise<VerificationResponse> {
    return this.post<VerificationResponse>(`/v3/businesses/claim/${request.claim_id}/verify`, {
      verification_code: request.verification_code
    });
  }
  
  /**
   * Upload a document for business verification
   * 
   * @param claimId Claim ID
   * @param documentType Type of document being uploaded
   * @param file File to upload
   * @returns Promise with document upload response
   */
  async uploadDocument(
    claimId: string,
    documentType: 'business_license' | 'utility_bill' | 'tax_document' | 'other',
    file: File | Buffer
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);
    
    return this.post<DocumentUploadResponse>(
      `/v3/businesses/claim/${claimId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  }
  
  /**
   * Cancel a pending claim
   * 
   * @param claimId Claim ID to cancel
   * @returns Promise with success status
   */
  async cancelClaim(claimId: string): Promise<{success: boolean}> {
    return this.delete<{success: boolean}>(`/v3/businesses/claim/${claimId}`);
  }
}

export default new ClaimBusinessClient();