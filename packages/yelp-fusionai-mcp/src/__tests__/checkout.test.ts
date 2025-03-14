import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import checkoutClient from '../services/api/checkout';
import {
  PaymentMethod,
  PaymentMethodsResponse,
  Invoice,
  InvoicesResponse,
  Payment,
  PaymentsResponse
} from '../services/api/checkout';

// Setup mock for axios
const mock = new MockAdapter(axios);

describe('Checkout API Client', () => {
  // Reset mocks before each test
  beforeEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  // Sample data for tests
  const samplePaymentMethod: PaymentMethod = {
    payment_method_id: 'pm_123456789',
    type: 'credit_card',
    status: 'active',
    card_details: {
      last4: '4242',
      brand: 'Visa',
      exp_month: 12,
      exp_year: 2025
    },
    is_default: true,
    created_at: '2023-01-15T12:00:00Z',
    updated_at: '2023-01-15T12:00:00Z'
  };

  const samplePaymentMethodsResponse: PaymentMethodsResponse = {
    payment_methods: [samplePaymentMethod],
    total: 1
  };

  const sampleInvoice: Invoice = {
    invoice_id: 'inv_123456789',
    invoice_number: 'INV-001',
    status: 'open',
    amount_cents: 15000,
    currency: 'USD',
    issue_date: '2023-01-15T12:00:00Z',
    due_date: '2023-02-15T12:00:00Z',
    line_items: [
      {
        description: 'Monthly subscription',
        amount_cents: 15000,
        quantity: 1,
        type: 'subscription'
      }
    ],
    pdf_url: 'https://example.com/invoice.pdf',
    portal_url: 'https://example.com/portal/invoice',
    created_at: '2023-01-15T12:00:00Z',
    updated_at: '2023-01-15T12:00:00Z'
  };

  const sampleInvoicesResponse: InvoicesResponse = {
    invoices: [sampleInvoice],
    total: 1
  };

  const samplePayment: Payment = {
    payment_id: 'py_123456789',
    invoice_id: 'inv_123456789',
    amount_cents: 15000,
    currency: 'USD',
    status: 'succeeded',
    payment_method_id: 'pm_123456789',
    payment_date: '2023-01-15T12:00:00Z',
    receipt_url: 'https://example.com/receipt',
    created_at: '2023-01-15T12:00:00Z',
    updated_at: '2023-01-15T12:00:00Z'
  };

  const samplePaymentsResponse: PaymentsResponse = {
    payments: [samplePayment],
    total: 1
  };

  describe('Payment Methods', () => {
    it('should get all payment methods', async () => {
      mock.onGet('/v3/checkout/payment_methods').reply(200, samplePaymentMethodsResponse);

      const response = await checkoutClient.getPaymentMethods();
      expect(response).toEqual(samplePaymentMethodsResponse);
      expect(response.payment_methods.length).toBe(1);
      expect(response.payment_methods[0].payment_method_id).toBe('pm_123456789');
    });

    it('should get payment methods for a specific business', async () => {
      mock.onGet('/v3/checkout/payment_methods', { params: { business_id: 'business123' } }).reply(200, samplePaymentMethodsResponse);

      const response = await checkoutClient.getPaymentMethods('business123');
      expect(response).toEqual(samplePaymentMethodsResponse);
    });

    it('should get a specific payment method by ID', async () => {
      mock.onGet('/v3/checkout/payment_methods/pm_123456789').reply(200, samplePaymentMethod);

      const response = await checkoutClient.getPaymentMethod('pm_123456789');
      expect(response).toEqual(samplePaymentMethod);
      expect(response.payment_method_id).toBe('pm_123456789');
      expect(response.type).toBe('credit_card');
    });

    it('should create a new payment method', async () => {
      const createRequest = {
        payment_token: 'tok_123456789',
        set_default: true,
        business_id: 'business123'
      };

      mock.onPost('/v3/checkout/payment_methods', createRequest).reply(200, samplePaymentMethod);

      const response = await checkoutClient.createPaymentMethod(createRequest);
      expect(response).toEqual(samplePaymentMethod);
      expect(response.payment_method_id).toBe('pm_123456789');
    });

    it('should update a payment method', async () => {
      const updateRequest = {
        set_default: true,
        billing_details: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      };

      mock.onPut('/v3/checkout/payment_methods/pm_123456789', updateRequest).reply(200, samplePaymentMethod);

      const response = await checkoutClient.updatePaymentMethod('pm_123456789', updateRequest);
      expect(response).toEqual(samplePaymentMethod);
    });

    it('should delete a payment method', async () => {
      mock.onDelete('/v3/checkout/payment_methods/pm_123456789').reply(200, { success: true });

      const response = await checkoutClient.deletePaymentMethod('pm_123456789');
      expect(response).toEqual({ success: true });
    });
  });

  describe('Invoices', () => {
    it('should get all invoices', async () => {
      mock.onGet('/v3/checkout/invoices').reply(200, sampleInvoicesResponse);

      const response = await checkoutClient.getInvoices();
      expect(response).toEqual(sampleInvoicesResponse);
      expect(response.invoices.length).toBe(1);
      expect(response.invoices[0].invoice_id).toBe('inv_123456789');
    });

    it('should get invoices with filters', async () => {
      const params = {
        business_id: 'business123',
        subscription_id: 'sub_123',
        limit: 10,
        offset: 0
      };

      mock.onGet('/v3/checkout/invoices', { params }).reply(200, sampleInvoicesResponse);

      const response = await checkoutClient.getInvoices(
        params.business_id,
        params.subscription_id,
        params.limit,
        params.offset
      );
      expect(response).toEqual(sampleInvoicesResponse);
    });

    it('should get a specific invoice by ID', async () => {
      mock.onGet('/v3/checkout/invoices/inv_123456789').reply(200, sampleInvoice);

      const response = await checkoutClient.getInvoice('inv_123456789');
      expect(response).toEqual(sampleInvoice);
      expect(response.invoice_id).toBe('inv_123456789');
      expect(response.amount_cents).toBe(15000);
    });

    it('should pay an invoice', async () => {
      const payRequest = {
        payment_method_id: 'pm_123456789'
      };

      mock.onPost('/v3/checkout/invoices/inv_123456789/pay', payRequest).reply(200, samplePayment);

      const response = await checkoutClient.payInvoice('inv_123456789', 'pm_123456789');
      expect(response).toEqual(samplePayment);
      expect(response.payment_id).toBe('py_123456789');
      expect(response.invoice_id).toBe('inv_123456789');
    });
  });

  describe('Payments', () => {
    it('should get all payments', async () => {
      mock.onGet('/v3/checkout/payments').reply(200, samplePaymentsResponse);

      const response = await checkoutClient.getPayments();
      expect(response).toEqual(samplePaymentsResponse);
      expect(response.payments.length).toBe(1);
      expect(response.payments[0].payment_id).toBe('py_123456789');
    });

    it('should get payments with filters', async () => {
      const params = {
        business_id: 'business123',
        subscription_id: 'sub_123',
        invoice_id: 'inv_123456789',
        limit: 10,
        offset: 0
      };

      mock.onGet('/v3/checkout/payments', { params }).reply(200, samplePaymentsResponse);

      const response = await checkoutClient.getPayments(
        params.business_id,
        params.subscription_id,
        params.invoice_id,
        params.limit,
        params.offset
      );
      expect(response).toEqual(samplePaymentsResponse);
    });

    it('should get a specific payment by ID', async () => {
      mock.onGet('/v3/checkout/payments/py_123456789').reply(200, samplePayment);

      const response = await checkoutClient.getPayment('py_123456789');
      expect(response).toEqual(samplePayment);
      expect(response.payment_id).toBe('py_123456789');
      expect(response.status).toBe('succeeded');
    });

    it('should refund a payment', async () => {
      const refundData = {
        amount_cents: 15000,
        reason: 'Customer requested'
      };

      const refundedPayment = {
        ...samplePayment,
        status: 'refunded'
      };

      mock.onPost('/v3/checkout/payments/py_123456789/refund', refundData).reply(200, refundedPayment);

      const response = await checkoutClient.refundPayment('py_123456789', refundData.amount_cents, refundData.reason);
      expect(response).toEqual(refundedPayment);
      expect(response.status).toBe('refunded');
    });
  });

  describe('Error handling', () => {
    it('should handle API errors', async () => {
      mock.onGet('/v3/checkout/payment_methods').reply(404, {
        error: {
          code: 'not_found',
          description: 'Resource not found'
        }
      });

      await expect(checkoutClient.getPaymentMethods()).rejects.toThrow();
    });
  });
});