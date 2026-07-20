/**
 * Platform-specific implementations keep expo-notifications out of the web
 * bundle. The native implementation lives in useRegisterPushNotifications.native.ts.
 */
export function useRegisterPushNotifications(_userId: string | undefined) {}
