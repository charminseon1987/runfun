import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Play, Calendar, User, Users, Utensils } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import RunScreen from '../screens/RunScreen';
import MarathonScreen from '../screens/MarathonScreen';
import FeedScreen from '../screens/FeedScreen';
import MyScreen from '../screens/MyScreen';
import FridgeScreen from '../screens/FridgeScreen';
import DrawingCourseScreen from '../screens/DrawingCourseScreen';
import { C } from '../theme/season';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.textSub,
        tabBarStyle: {
          backgroundColor: C.bg,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="홈"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <Home color={color} size={24} /> }}
      />
      <Tab.Screen
        name="러닝"
        component={RunScreen}
        options={{ tabBarIcon: ({ color }) => <Play color={color} size={24} /> }}
      />
      <Tab.Screen
        name="마라톤"
        component={MarathonScreen}
        options={{ tabBarIcon: ({ color }) => <Calendar color={color} size={24} /> }}
      />
      <Tab.Screen
        name="피드"
        component={FeedScreen}
        options={{ tabBarIcon: ({ color }) => <Users color={color} size={24} /> }}
      />
      <Tab.Screen
        name="MY"
        component={MyScreen}
        options={{ tabBarIcon: ({ color }) => <User color={color} size={24} /> }}
      />
      <Tab.Screen
        name="냉장고"
        component={FridgeScreen}
        options={{ tabBarIcon: ({ color }) => <Utensils color={color} size={24} /> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTabs" component={HomeTabs} />
      <Stack.Screen name="DrawingCourse" component={DrawingCourseScreen} />
    </Stack.Navigator>
  );
}
