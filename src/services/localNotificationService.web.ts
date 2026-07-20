/** Local push notifications are unavailable and unnecessary on web. */
export async function showLocalNotificationForUser(
  _targetUserId: string,
  _title: string,
  _message: string,
): Promise<void> {}
