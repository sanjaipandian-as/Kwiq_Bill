import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveUserDetailsToDrive, syncUserDataToDrive, restoreUserDataFromDrive } from '../services/googleDriveservices';
import { fetchAllTableData, clearDatabase } from '../services/database';
import services from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Keeps login/session data in AsyncStorage
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.log('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const googleLogin = async (idToken, userProfile) => {
    try {
      const userData = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        photo: userProfile.photo,
      };

      // 2. EXCHANGE: Send Google token to backend to get our own JWT
      let backendToken = idToken;
      try {
        console.log('Exchanging token with backend...');
        const authResponse = await services.auth.googleLogin(idToken);
        if (authResponse && authResponse.token) {
          backendToken = authResponse.token;
          // Update userData with backend ID if available
          if (authResponse.user && authResponse.user.id) {
            userData.backendId = authResponse.user.id;
          }
          console.log('Successfully exchanged Google token for backend JWT');
        }
      } catch (authError) {
        console.warn('Backend Auth Exchange failed:', authError.message);
        const { Alert } = require('react-native');
        Alert.alert(
          "Server Connection Failed",
          "Login successful with Google, but couldn't connect to Zilling Server. Onboarding data will only be saved to Google Drive. \n\nError: " + authError.message
        );
      }

      // 3. Save locally
      await AsyncStorage.setItem('token', backendToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      // 4. RESTORE: Fetch Snapshot & Settings from Drive (Before setting user state)
      try {
        await restoreUserDataFromDrive(userData);
      } catch (restoreErr) {
        console.log('Restore failed:', restoreErr);
      }

      // 5. Update State
      setUser(userData);

      // 6. AUTO-SYNC: Sync Down Events
      try {
        await saveUserDetailsToDrive(userData);
        const { SyncService } = require('../services/OneWaySyncService');
        await SyncService.syncDown();
      } catch (syncError) {
        console.log('Initial Sync Down failed:', syncError);
      }

      return userData;
    } catch (error) {
      console.error('Local Auth Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      await GoogleSignin.signOut();
    } catch (e) {
      console.log('Google signOut error:', e);
    } finally {
      setUser(null);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await clearDatabase();
      const { SyncService } = require('../services/OneWaySyncService');
      await SyncService.resetSyncState();
      await AsyncStorage.multiRemove(['app_settings', 'last_synced_timestamp', 'processed_events_ids', 'pending_upload_queue']);
    }
  };

  const skipLogin = () => {
    const devUser = { id: 'dev-mode', name: 'Dev User', role: 'admin' };
    setUser(devUser);
  };

  return (
    <AuthContext.Provider value={{ user, googleLogin, skipLogin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};