import { API_URL } from "../config/api";

const authProvider = {
  login: async ({ username, password }) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const errTxt = await response.json();
        console.error("Login failes:", errTxt);
        throw new Error("Invalid admin credentials");
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      return Promise.resolve();
    } catch (error) {
      console.error("Login error:", error);
      throw new Error("Login failed");
    }
  },

  logout: async () => {
    try {
      await fetch(`${API_URL}/api/admin/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    return Promise.resolve();
  },

  checkAuth: async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/me`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        console.log("Admin auth check passed");
        return Promise.resolve();
      } else {
        console.log("Admin auth check failed:", res.status);
        return Promise.reject();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      return Promise.reject();
    }
  },

  checkError: (error) => {
    const status = error?.status || error?.response?.status;
    if (status === 401 || status === 403) {
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getPermissions: () => Promise.resolve(),
};

export default authProvider;
