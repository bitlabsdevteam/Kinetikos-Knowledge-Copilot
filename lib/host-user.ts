export const HOST_USER_EVENT_TYPE = 'kinetikos:set-user';

export type HostUserPayload = {
  type: typeof HOST_USER_EVENT_TYPE;
  userId: string;
  displayName?: string;
};

export function isHostUserPayload(value: unknown): value is HostUserPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Partial<HostUserPayload>;

  return payload.type === HOST_USER_EVENT_TYPE && typeof payload.userId === 'string';
}
