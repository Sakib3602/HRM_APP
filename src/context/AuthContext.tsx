import { clearTokens, getRefreshToken, saveTokens } from "@/storage/secureStore";
import React, { createContext, useContext, useEffect, useState } from "react";
import axiosClient, { setUnauthorizedCallback } from "../api/axiosClient";


type Role = "hr" | "employee";

interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedCallback(() => {
      setUser(null);
    });
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await axiosClient.get("/auth/me");
        if (res.data && res.data.isActive === false) {
          await clearTokens();
          setUser(null);
        } else {
          setUser(res.data);
        }
      } catch {
        await clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await axiosClient.post("/auth/login", { email, password });
    const { accessToken, refreshToken, user: loggedInUser } = res.data;
    if (loggedInUser && loggedInUser.isActive === false) {
      throw new Error("Your account is deactivated. Please contact support.");
    }
    await saveTokens(accessToken, refreshToken);
    setUser(loggedInUser);
  };

  const logout = async () => {
    try {
      await axiosClient.post("/auth/logout");
    } catch {}
    await clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};