import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { HouseholdProvider } from './src/context/HouseholdContext';
import { BabyLogsProvider } from './src/context/BabyLogsContext';
import { MessagesProvider } from './src/context/MessagesContext';
import { MedicationsProvider } from './src/context/MedicationsContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <HouseholdProvider>
          <BabyLogsProvider>
            <MessagesProvider>
              <MedicationsProvider>
                <StatusBar style="dark" />
                <AppNavigator />
              </MedicationsProvider>
            </MessagesProvider>
          </BabyLogsProvider>
        </HouseholdProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
