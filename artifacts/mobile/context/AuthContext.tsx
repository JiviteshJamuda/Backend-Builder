import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

interface User {
  id: number;
  username: string;
  role: string;
  name: string;
  email?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: async () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (domain) {
      setBaseUrl(`https://${domain}`);
    }
    setAuthTokenGetter(() => token);
  }, [token]);

  useEffect(() => {
    AsyncStorage.multiGet(["auth_token", "auth_user"]).then(([tokenItem, userItem]) => {
      const storedToken = tokenItem[1];
      const storedUser = userItem[1];
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (newToken: string, newUser: User) => {
    await AsyncStorage.multiSet([
      ["auth_token", newToken],
      ["auth_user", JSON.stringify(newUser)],
    ]);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["auth_token", "auth_user"]);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
