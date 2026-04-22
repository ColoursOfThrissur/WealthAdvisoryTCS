import { API_BASE_URL } from '../config/api';

class ApiService {
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.json();
  }

  async createSession() {
    const response = await fetch(`${API_BASE_URL}/api/session/create`, {
      method: 'POST',
    });
    return response.json();
  }

  async getSessionStatus(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}`);
    return response.json();
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }

  getDownloadUrl(filename) {
    const base = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}/api/download/${filename}`;
  }
}

export default new ApiService();
