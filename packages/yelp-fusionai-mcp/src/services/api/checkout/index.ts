import { BaseApiClient } from '../base';

/**
 * Payment method interface
 */
export interface PaymentMethod {
  /**
   * Payment method ID
   */
  payment_method_id: string;
  
  /**
   * Payment method type
   */
  type: 'credit_card' | 'bank_account' | 'digital_wallet';
  
  /**
   * Payment method status
   */
  status: 'active' | 'expired' | 'invalid';
  
  /**
   * Card details (if type is credit_card)
   */
  card_details?: {
    /**
     * Last 4 digits of card number
     */
    last4: string;
    
    /**
     * Card brand (Visa, Mastercard, etc.)
     */
    brand: string;
    
    /**
     * Expiration month
     */
    exp_month: number;
    
    /**
     * Expiration year
     */
    exp_year: number;
  };
  
  /**
   * Is this the default payment method
   */
  is_default: boolean;
  
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
 * Payment methods list response
 */
export interface PaymentMethodsResponse {
  /**
   * List of payment methods
   */
  payment_methods: PaymentMethod[];
  
  /**
   * Total count of payment methods
   */
  total: number;
}

/**
 * Payment method request for creation
 */
export interface CreatePaymentMethodRequest {
  /**
   * Payment token from the payment processor
   */
  payment_token: string;
  
  /**
   * Set as default payment method
   */
  set_default?: boolean;
  
  /**
   * Business ID to associate with (optional)
   */
  business_id?: string;
  
  /**
   * Billing details
   */
  billing_details?: {
    /**
     * Name on the payment method
     */
    name?: string;
    
    /**
     * Email address
     */
    email?: string;
    
    /**
     * Phone number
     */
    phone?: string;
    
    /**
     * Billing address
     */
    address?: {
      /**
       * Street address line 1
       */
      line1: string;
      
      /**
       * Street address line 2
       */
      line2?: string;
      
      /**
       * City
       */
      city: string;
      
      /**
       * State/province
       */
      state: string;
      
      /**
       * Postal code
       */
      postal_code: string;
      
      /**
       * Country code
       */
      country: string;
    };
  };
}

/**
 * Update payment method request
 */
export interface UpdatePaymentMethodRequest {
  /**
   * Set as default payment method
   */
  set_default?: boolean;
  
  /**
   * Billing details
   */
  billing_details?: {
    /**
     * Name on the payment method
     */
    name?: string;
    
    /**
     * Email address
     */
    email?: string;
    
    /**
     * Phone number
     */
    phone?: string;
    
    /**
     * Billing address
     */
    address?: {
      /**
       * Street address line 1
       */
      line1: string;
      
      /**
       * Street address line 2
       */
      line2?: string;
      
      /**
       * City
       */
      city: string;
      
      /**
       * State/province
       */
      state: string;
      
      /**
       * Postal code
       */
      postal_code: string;
      
      /**
       * Country code
       */
      country: string;
    };
  };
}

/**
 * Invoice interface
 */
export interface Invoice {
  /**
   * Invoice ID
   */
  invoice_id: string;
  
  /**
   * Business ID (if applicable)
   */
  business_id?: string;
  
  /**
   * Subscription ID (if applicable)
   */
  subscription_id?: string;
  
  /**
   * Invoice number
   */
  invoice_number: string;
  
  /**
   * Invoice status
   */
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  
  /**
   * Invoice amount in cents
   */
  amount_cents: number;
  
  /**
   * Invoice currency (ISO code)
   */
  currency: string;
  
  /**
   * Issue date (ISO 8601 format)
   */
  issue_date: string;
  
  /**
   * Due date (ISO 8601 format)
   */
  due_date: string;
  
  /**
   * Payment date (ISO 8601 format)
   */
  payment_date?: string;
  
  /**
   * Line items on the invoice
   */
  line_items: {
    /**
     * Description of the line item
     */
    description: string;
    
    /**
     * Amount in cents
     */
    amount_cents: number;
    
    /**
     * Quantity
     */
    quantity: number;
    
    /**
     * Line item type
     */
    type: 'subscription' | 'one_time' | 'tax' | 'discount';
  }[];
  
  /**
   * URL to download the invoice PDF
   */
  pdf_url?: string;
  
  /**
   * URL to view the invoice in the web portal
   */
  portal_url?: string;
  
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
 * Invoices list response
 */
export interface InvoicesResponse {
  /**
   * List of invoices
   */
  invoices: Invoice[];
  
  /**
   * Total count of invoices
   */
  total: number;
}

/**
 * Payment interface
 */
export interface Payment {
  /**
   * Payment ID
   */
  payment_id: string;
  
  /**
   * Invoice ID
   */
  invoice_id: string;
  
  /**
   * Business ID (if applicable)
   */
  business_id?: string;
  
  /**
   * Subscription ID (if applicable)
   */
  subscription_id?: string;
  
  /**
   * Payment amount in cents
   */
  amount_cents: number;
  
  /**
   * Payment currency (ISO code)
   */
  currency: string;
  
  /**
   * Payment status
   */
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  
  /**
   * Payment method ID
   */
  payment_method_id: string;
  
  /**
   * Payment date (ISO 8601 format)
   */
  payment_date: string;
  
  /**
   * Failure reason (if applicable)
   */
  failure_reason?: string;
  
  /**
   * Receipt URL
   */
  receipt_url?: string;
  
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
 * Payments list response
 */
export interface PaymentsResponse {
  /**
   * List of payments
   */
  payments: Payment[];
  
  /**
   * Total count of payments
   */
  total: number;
}

/**
 * Checkout API client for Yelp Fusion API
 */
export class CheckoutClient extends BaseApiClient {
  /**
   * Get all payment methods
   * 
   * @param businessId Optional business ID to filter by
   * @returns Promise with payment methods
   */
  async getPaymentMethods(businessId?: string): Promise<PaymentMethodsResponse> {
    const params = businessId ? { business_id: businessId } : undefined;
    return this.get<PaymentMethodsResponse>('/v3/checkout/payment_methods', params);
  }
  
  /**
   * Get a single payment method by ID
   * 
   * @param paymentMethodId Payment method ID
   * @returns Promise with payment method
   */
  async getPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    return this.get<PaymentMethod>(`/v3/checkout/payment_methods/${paymentMethodId}`);
  }
  
  /**
   * Create a new payment method
   * 
   * @param request Payment method request
   * @returns Promise with created payment method
   */
  async createPaymentMethod(request: CreatePaymentMethodRequest): Promise<PaymentMethod> {
    return this.post<PaymentMethod>('/v3/checkout/payment_methods', request);
  }
  
  /**
   * Update an existing payment method
   * 
   * @param paymentMethodId Payment method ID
   * @param request Update request
   * @returns Promise with updated payment method
   */
  async updatePaymentMethod(paymentMethodId: string, request: UpdatePaymentMethodRequest): Promise<PaymentMethod> {
    return this.put<PaymentMethod>(`/v3/checkout/payment_methods/${paymentMethodId}`, request);
  }
  
  /**
   * Delete a payment method
   * 
   * @param paymentMethodId Payment method ID
   * @returns Promise with success status
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<{success: boolean}> {
    return this.delete<{success: boolean}>(`/v3/checkout/payment_methods/${paymentMethodId}`);
  }
  
  /**
   * Get all invoices
   * 
   * @param businessId Optional business ID to filter by
   * @param subscriptionId Optional subscription ID to filter by
   * @param limit Optional limit of results
   * @param offset Optional offset for pagination
   * @returns Promise with invoices
   */
  async getInvoices(businessId?: string, subscriptionId?: string, limit?: number, offset?: number): Promise<InvoicesResponse> {
    const params: Record<string, any> = {};
    
    if (businessId) params.business_id = businessId;
    if (subscriptionId) params.subscription_id = subscriptionId;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    
    return this.get<InvoicesResponse>('/v3/checkout/invoices', params);
  }
  
  /**
   * Get a single invoice by ID
   * 
   * @param invoiceId Invoice ID
   * @returns Promise with invoice
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    return this.get<Invoice>(`/v3/checkout/invoices/${invoiceId}`);
  }
  
  /**
   * Pay an invoice with a specific payment method
   * 
   * @param invoiceId Invoice ID
   * @param paymentMethodId Payment method ID to use
   * @returns Promise with payment result
   */
  async payInvoice(invoiceId: string, paymentMethodId: string): Promise<Payment> {
    return this.post<Payment>(`/v3/checkout/invoices/${invoiceId}/pay`, {
      payment_method_id: paymentMethodId
    });
  }
  
  /**
   * Get payments
   * 
   * @param businessId Optional business ID to filter by
   * @param subscriptionId Optional subscription ID to filter by
   * @param invoiceId Optional invoice ID to filter by
   * @param limit Optional limit of results
   * @param offset Optional offset for pagination
   * @returns Promise with payments
   */
  async getPayments(businessId?: string, subscriptionId?: string, invoiceId?: string, limit?: number, offset?: number): Promise<PaymentsResponse> {
    const params: Record<string, any> = {};
    
    if (businessId) params.business_id = businessId;
    if (subscriptionId) params.subscription_id = subscriptionId;
    if (invoiceId) params.invoice_id = invoiceId;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    
    return this.get<PaymentsResponse>('/v3/checkout/payments', params);
  }
  
  /**
   * Get a single payment by ID
   * 
   * @param paymentId Payment ID
   * @returns Promise with payment details
   */
  async getPayment(paymentId: string): Promise<Payment> {
    return this.get<Payment>(`/v3/checkout/payments/${paymentId}`);
  }
  
  /**
   * Request a refund for a payment
   * 
   * @param paymentId Payment ID
   * @param amount Optional amount to refund in cents (default: full amount)
   * @param reason Optional reason for the refund
   * @returns Promise with refund details
   */
  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<Payment> {
    const data: Record<string, any> = {};
    
    if (amount) data.amount_cents = amount;
    if (reason) data.reason = reason;
    
    return this.post<Payment>(`/v3/checkout/payments/${paymentId}/refund`, data);
  }
}

export default new CheckoutClient();