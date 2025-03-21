const mockAxios = {
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn(),
    delete: jest.fn(),
  })),
  isAxiosError: jest.fn((error) => error.isAxiosError),
};

module.exports = mockAxios;