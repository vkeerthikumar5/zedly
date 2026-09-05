import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const AuthContext = createContext();

// Dynamically grab the IP address of your dev machine provided by Expo, so it updates automatically when network/hotspot changes
const getHostIp = () => {
    const hostUri = Constants.expoConfig?.hostUri 
        || Constants.manifest2?.extra?.expoGo?.debuggerHost 
        || Constants.manifest?.debuggerHost;
    
    if (hostUri) {
        const ip = hostUri.split(':')[0];
        if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
            return ip;
        }
    }
    return '192.168.179.24'; // Fallback IP
};

const HOST_IP = getHostIp();
export const API_URL = `http://${HOST_IP}:8000`;
console.log(`[Mobile API_URL] Configured to: ${API_URL}`);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    const res = await axios.get(`${API_URL}/api/auth/user/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(res.data);
                }
            } catch (error) {
                console.log("Token validation failed:", error);
                await AsyncStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const login = async (data) => {
        await AsyncStorage.setItem('token', data.token);
        setUser(data.user);
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
