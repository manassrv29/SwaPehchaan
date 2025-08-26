import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use localhost for iOS simulator, 10.0.2.2 for Android emulator, or your LAN IP for physical devices
const getBaseUrl = () => {
  if (Platform.OS === 'ios') {
    return 'http://localhost:5001';
  } else if (Platform.OS === 'android') {
    return 'http://10.171.116.201:5001'; // Use the actual network IP for Android
  } else {
    // For web or when running on a physical device, use the local IP address
    return 'http://10.171.116.201:5001'; // Using the correct IP address
  }
};

export const API_BASE_URL = getBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
  // Add proxy configuration for development
  proxy: false
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('session_token');
    if (token) {
      config.headers['Authorization'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// User types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

// Auth functions
export const loginUser = async (email: string, password: string, role: 'user' | 'admin') => {
  try {
    console.log(`Attempting to login with email: ${email}, role: ${role}`);
    console.log(`API base URL: ${API_BASE_URL}`);
    
    const response = await api.post('/login', { email, password, role });
    console.log('Login response:', response.data);
    
    if (response.data.session_token) {
      await AsyncStorage.setItem('session_token', response.data.session_token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error: any) {
    console.error('Login error details:', error.message);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    }
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userJson = await AsyncStorage.getItem('user');
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem('session_token');
    await AsyncStorage.removeItem('user');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

// Activity functions
export const getUserActivities = async () => {
  try {
    const response = await api.get('/activities');
    return response.data;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

// Signup function
export const signupUser = async (email: string, name: string, password: string, role: 'user' | 'admin', challengePhrase: string) => {
  try {
    console.log(`Attempting to signup with email: ${email}, name: ${name}, role: ${role}`);
    console.log(`API base URL: ${API_BASE_URL}`);
    
    // Log the request payload for debugging
    const payload = {
      email,
      name,
      password,
      role,
      challenge_phrase: challengePhrase
    };
    console.log('Signup payload:', JSON.stringify(payload));
    
    // Make direct fetch request as a fallback if axios fails
    try {
      const response = await api.post('/signup', payload);
      console.log('Signup response:', response.data);
      return response.data;
    } catch (axiosError: any) {
      console.error('Axios signup failed, trying fetch as fallback');
      
      // Try with fetch as a fallback
      const fetchResponse = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!fetchResponse.ok) {
        throw new Error(`Fetch error: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }
      
      const data = await fetchResponse.json();
      console.log('Fetch signup response:', data);
      return data;
    }
  } catch (error: any) {
    console.error('Signup error:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw error;
  }
};
