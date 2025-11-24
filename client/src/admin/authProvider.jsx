const authProvider = {
  login: async ({ username, password }) => {
    try {
      const response = await fetch("http://localhost:8080/api/admin/login", {
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

      const data = await response.json();

      if (data.token) {
        localStorage.setItem("adminToken", data.token);
        console.log("💾 Token saved to localStorage");
      } else {
        console.error("No token in response!");
        throw new Error("No token received");
      }

      return Promise.resolve();
    } catch (error) {
      console.error("Login error:", error);
      throw new Error("Login failed");
    }
  },

  logout: async () => {
    localStorage.removeItem("adminToken");

    try {
      await fetch("http://localhost:8080/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    return Promise.resolve();
  },

  checkAuth: async () => {
    // check token
    const token = localStorage.getItem("adminToken");
    if (!token) {
      console.log("No admin token found in localStorage");
      return Promise.reject();
    }

    try {
      const res = await fetch("http://localhost:8080/api/admin/me", {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        localStorage.removeItem("adminToken");
        return Promise.reject();
      }

      return Promise.resolve();
    } catch (error) {
      console.error("Auth check error:", error);
      localStorage.removeItem("adminToken");
      return Promise.reject();
    }
  },

  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("adminToken");
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getPermissions: () => Promise.resolve(),
};

export default authProvider;
