import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#10b981',
      tabBarInactiveTintColor: '#666',
      tabBarStyle: { backgroundColor: '#111', borderTopColor: '#222', paddingBottom: 4 },
      headerStyle: { backgroundColor: '#111' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700' },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Harita',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>&#x1F5FA;</Text>,
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: 'Sürüşler',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>&#x1F6B2;</Text>,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Cüzdan',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>&#x1F4B3;</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>&#x1F464;</Text>,
        }}
      />
    </Tabs>
  );
}
