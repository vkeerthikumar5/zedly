import React, { useState, useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Organized src folder imports
import SplashScreen from './src/pages/Splash/SplashScreen';
import AuthScreen from './src/pages/Auth/AuthScreen';
import UserDashboard from './src/pages/UserDashboard/UserDashboard';
import { AuthProvider, useAuth } from './src/context/AuthContext';

function AppContent() {
  const [appIsReady, setAppIsReady] = useState(false);
  const { user, loading } = useAuth();
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Only begin the splash timer once the backend has verified the stored token
    if (!loading) {
        const timer = setTimeout(() => {
          Animated.timing(fadeOutAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }).start(() => {
            setAppIsReady(true);
          });
        }, 3000); // 3 sec timer so it doesn't hang unnecessarily long
        
        return () => clearTimeout(timer);
    }
  }, [fadeOutAnim, loading]);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar style={appIsReady ? "dark" : "light"} />
      
      {appIsReady ? (
        user ? (
          <UserDashboard />
        ) : (
          <AuthScreen />
        )
      ) : (
        <View style={{ flex: 1 }} />
      )}
      
      {!appIsReady && (
        <SplashScreen fadeOutAnim={fadeOutAnim} />
      )}
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
