"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";

const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const router = useRouter();
  const [state, setState] = useState(() => ({
    loading: false,
    getUserLoading: true,
    error: null,
    user: null,
  }));

  const fetchUser = useCallback(async () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    console.log("Token :",JSON.parse(atob(token.split(".")[1])))
    if (!token) {
      setState((prev) => ({
        ...prev,
        user: null,
        getUserLoading: false,
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, getUserLoading: true }));

      const response = await axios.get("/api/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(response)
      setState((prev) => ({
        ...prev,
        user: response.data,
        getUserLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        user: null,
        getUserLoading: false,
        error: error.response?.data?.error ?? error.message,
      }));
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
      }
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await axios.post("/api/auth/login", { email, password });

      const token = response.data?.data.token;
      if (!token || typeof token !== "string") {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Invalid login response: no token",
        }));
        return { error: "Invalid login response: no token" };  
      }

      localStorage.setItem("token", token);
      setState((prev) => ({ ...prev, loading: false, error: null }));

      await fetchUser();
      router.push("/");
      return {};
    } catch (error) {
      const message = error.response?.data?.error || error.message || "Login failed";
      setState((prev) => ({
        ...prev,
        error: message,
        loading: false,
      }));
      return { error: message };
    }
  };

  const register = async (data) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      await axios.post("/api/auth/register", data);

      setState((prev) => ({ ...prev, loading: false, error: null }));
      router.push("/login");
      return {};
    } catch (error) {
      const message = error.response?.data?.error || error.message || "Registration failed";
      setState((prev) => ({
        ...prev,
        error: message,
        loading: false,
      }));
      return { error: message };
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    setState((prev) => ({
      ...prev,
      user: null,
      loading: false,
      error: null,
    }));
    router.push("/");
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    isAuthenticated: Boolean(state.user),
    userRole: state.user?.role ?? null,
    fetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };
