// app/index.tsx
import { useRouter } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome! Click below to login.</Text>
      <Button title="Go to Login" onPress={() => router.push('/login')} />
    </View>
  );
}
