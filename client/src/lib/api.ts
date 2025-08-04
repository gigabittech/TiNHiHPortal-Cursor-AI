class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private baseURL = "";

  private async request(method: string, url: string, data?: any): Promise<any> {
    const token = localStorage.getItem("token");
    
    const config: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: "include",
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${this.baseURL}${url}`, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorText;
        } catch {
          errorMessage = errorText || response.statusText;
        }
        
        // Handle token expiration
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          // Redirect to login page
          window.location.href = "/login";
        }
        
        throw new ApiError(response.status, errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Log the actual error for debugging
      console.error("API Request Error:", error);
      throw new ApiError(0, "Network error or server unavailable");
    }
  }

  async get(url: string): Promise<any> {
    return this.request("GET", url);
  }

  async post(url: string, data?: any): Promise<any> {
    return this.request("POST", url, data);
  }

  async put(url: string, data?: any): Promise<any> {
    return this.request("PUT", url, data);
  }

  async patch(url: string, data?: any): Promise<any> {
    return this.request("PATCH", url, data);
  }

  async delete(url: string): Promise<any> {
    return this.request("DELETE", url);
  }
}

export const api = new ApiClient();
