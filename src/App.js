import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { AgentProvider } from './context/AgentContext';
import AgentFab from './components/AgentFab';
import AgentCoachModal from './components/AgentCoachModal';
import AppNavigator from './navigation/AppNavigator';
import { C } from './theme/season';

enableScreens();

export default function App() {
  return (
    <AgentProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor={C.bg} />
          <AppNavigator />
        </NavigationContainer>
        <AgentFab />
        <AgentCoachModal />
      </SafeAreaProvider>
    </AgentProvider>
  );
}
