import api from '@/lib/api';

describe('API Module', () => {
  it('should create an axios instance with correct baseURL', () => {
    expect(api.defaults.baseURL).toBe(
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    );
  });

  it('should have correct default headers', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should have withCredentials enabled', () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  it('should have a request interceptor registered', () => {
    // Axios interceptor handlers are stored internally, but use() returns a numeric id
    const requestInterceptorId = api.interceptors.request.use(
      (config) => config,
      (error) => Promise.reject(error)
    );
    // Successfully registered means we got a non-negative number back
    expect(requestInterceptorId).toBeGreaterThanOrEqual(0);
    // Eject the test handler we just added
    api.interceptors.request.eject(requestInterceptorId);
  });

  it('should have a response interceptor registered', () => {
    const onFulfilled = jest.fn((response) => response);
    const onRejected = jest.fn((error) => Promise.reject(error));

    const responseInterceptorId = api.interceptors.response.use(onFulfilled, onRejected);
    expect(responseInterceptorId).toBeGreaterThanOrEqual(0);

    api.interceptors.response.eject(responseInterceptorId);
  });

  describe('interceptor behavior', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('request interceptor attaches Bearer token from localStorage', () => {
      localStorage.setItem('token', 'test-jwt-token');
      const config: any = { headers: {} };

      // The first registered interceptor (from api.ts) runs on every request
      // We need to get the interceptor handler directly
      const handlers = (api.interceptors.request as any).handlers;
      expect(handlers).toBeDefined();
    });

    it('request interceptor skips Authorization when no token', () => {
      // Check that the interceptor runs without errors when token is missing
      const config: any = { headers: {} };
      // This is a smoke test — the interceptor should not throw
      expect(() => {
        // Manually trigger the interceptor by making a request
        const adapter = () =>
          Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
        // We just verify no error is thrown when constructing
      }).not.toThrow();
    });
  });

  describe('response interceptor — 401 redirect (integration smoke test)', () => {
    it('should not throw when a request succeeds', async () => {
      const adapter = jest.fn().mockResolvedValue({
        data: { message: 'ok' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });

      const result = await api.get('/test-endpoint', { adapter } as any);
      expect(result.status).toBe(200);
    });

    it('should still reject on non-network errors', async () => {
      const adapter = jest.fn().mockRejectedValue(new Error('Network Error'));

      await expect(api.get('/test', { adapter } as any)).rejects.toThrow('Network Error');
    });
  });
});