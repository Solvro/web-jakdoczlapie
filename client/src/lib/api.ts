const API_BASE_URL = '/api/v1';

export const api = {
  operators: {
    getAll: () => `${API_BASE_URL}/operators`,
    getRoutes: (name: string) => `${API_BASE_URL}/operators/${encodeURIComponent(name)}/routes`,
    getReports: (name: string) => `${API_BASE_URL}/operators/${encodeURIComponent(name)}/reports`,
    getSchedules: (name: string) => `${API_BASE_URL}/operators/${encodeURIComponent(name)}/schedules`,
    getStops: (name: string) => `${API_BASE_URL}/operators/${encodeURIComponent(name)}/stops`,
  },
  routes: {
    getAll: (params?: { 
      fromLatitude?: number;
      fromLongitude?: number;
      toLatitude?: number;
      toLongitude?: number;
      radius?: number;
      transferRadius?: number;
      maxTransfers?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
      }
      return `${API_BASE_URL}/routes${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    },
    getById: (id: number, destination?: string) => {
      const searchParams = new URLSearchParams();
      if (destination) {
        searchParams.append('destination', destination);
      }
      return `${API_BASE_URL}/routes/${id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    },
    getReports: (id: number) => `${API_BASE_URL}/routes/${id}/reports`,
    createReport: (id: number) => `${API_BASE_URL}/routes/${id}/reports`,
    createTrack: (id: number) => `${API_BASE_URL}/routes/${id}/tracks`,
  },
  stops: {
    getAll: (params?: {
      latitude?: number;
      longitude?: number;
      radius?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
      }
      return `${API_BASE_URL}/stops${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    },
    getById: (id: number) => `${API_BASE_URL}/stops/${id}`,
  },
};
