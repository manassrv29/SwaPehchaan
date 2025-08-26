import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomePage from './screens/WelcomePage';
import LoginScreen from './screens/LoginScreen';
import UserDashboardScreen from './screens/UserDashboardScreen';
import CaptureReferenceScreen from './screens/CaptureReferenceScreen';
import SubmitCertificateScreen from './screens/SubmitCertificateScreen';
import LivenessCheckScreen from './screens/LivenessCheckScreen';
import SuccessScreen from './screens/SuccessScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import ActivityScreen from './screens/ActivityScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomePage} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="UserDashboard" component={UserDashboardScreen} options={{ title: 'Dashboard', headerShown: false }} />
        <Stack.Screen name="CaptureReference" component={CaptureReferenceScreen} />
        <Stack.Screen name="SubmitCertificate" component={SubmitCertificateScreen} />
        <Stack.Screen name="LivenessCheck" component={LivenessCheckScreen} />
        <Stack.Screen name="Success" component={SuccessScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="Activity" component={ActivityScreen} options={{ title: 'Activity Log' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}