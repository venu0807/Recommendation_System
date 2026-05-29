import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import API_BASE_URL from "../config";

/**
 * Authentication hook providing login, register, logout, and token refresh.
 * @param {import('react-router-dom').NavigateFunction} navigate
 * @returns {{
 *   authTokens: object|null,
 *   setAuthTokens: Function,
 *   user: object|null,
 *   setUser: Function,
 *   registerUser: Function,
 *   loginUser: Function,
 *   logoutUser: Function,
 *   updateToken: Function,
 *   fetchUserProfile: Function,
 *   updateProfile: Function,
 * }}
 */
export function useAuth(navigate) {
  const [authTokens, setAuthTokens] = useState(null);
  const [user, setUser] = useState(null);

  const fetchUserProfile = async () => {
    if (!authTokens?.access) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/me/`, {
        headers: {
          Authorization: `Bearer ${authTokens.access}`,
        },
      });

      if (response.ok) {
        const profileData = await response.json();
        setUser((prev) => ({ ...prev, profile: profileData }));
      } else {
        console.error('Failed to fetch user profile');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const updateProfile = async (profileData) => {
    const formData = new FormData();
    Object.entries(profileData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    try {
      const profileResponse = await fetch(`${API_BASE_URL}/api/user/me/`, {
        headers: {
          Authorization: `Bearer ${authTokens?.access}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to get current profile');
      }

      const currentProfile = await profileResponse.json();

      const response = await fetch(`${API_BASE_URL}/user/${currentProfile.id}/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authTokens?.access}`,
        },
        body: formData,
      });

      if (response.ok) {
        const updated = await response.json();
        setUser((prev) => ({ ...prev, profile: updated }));
        return { success: true, message: 'Profile updated successfully' };
      } else {
        return { success: false, message: 'Failed to update profile' };
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      return { success: false, message: 'Error updating profile' };
    }
  };

  const registerUser = async (e, registerData) => {
    e.preventDefault();
    const { username, email, first_name, last_name, password, confirmPassword } =
      registerData;

    if (
      !username ||
      !first_name ||
      !last_name ||
      !password ||
      password !== confirmPassword
    ) {
      console.error("Invalid Data");
      return;
    }

    try {
      const registerResponse = await fetch(`${API_BASE_URL}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          first_name,
          last_name,
          email,
        }),
      });

      if (registerResponse.ok) {
        navigate("/login");
      } else {
        console.error("Registration failed");
      }
    } catch (error) {
      console.error("Error during registration", error);
    }
  };

  const loginUser = async (e) => {
    e.preventDefault();
    const response = await fetch(`${API_BASE_URL}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        username: e.target.username.value,
        password: e.target.password.value,
      }),
    });

    const data = await response.json();

    if (response.status === 200) {
      setAuthTokens(data);
      setUser(jwtDecode(data.access));
      await fetchUserProfile();
      navigate("/");
    } else {
      alert("Something went wrong!");
    }
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    navigate("/");
  };

  const updateToken = async () => {
    try {
      if (!authTokens?.refresh) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ refresh: authTokens.refresh }),
      });

      if (!response.ok) {
        console.error("Token refresh failed:", response.status);
        logoutUser();
        return;
      }

      const data = await response.json();
      setAuthTokens(data);
      setUser(jwtDecode(data.access));
    } catch (error) {
      console.error("Token refresh error:", error);
      logoutUser();
    }
  };

  return {
    authTokens,
    setAuthTokens,
    user,
    setUser,
    registerUser,
    loginUser,
    logoutUser,
    updateToken,
    fetchUserProfile,
    updateProfile,
  };
}
