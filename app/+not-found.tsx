import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { SeoHead } from '@/src/components/SeoHead';

export default function NotFoundScreen() {
  return (
    <>
      <SeoHead title="Page Not Found" description="The page you're looking for doesn't exist." noIndex />
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <AppText variant="h2" weight="semibold">This screen does not exist.</AppText>
        <Link href="/" style={styles.link}>
          <AppText>Go to home screen!</AppText>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
