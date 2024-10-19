export const IDLE_TIMEOUT: number = 60;
export const TIMEFRAME_PING_DISCONNECT: number = 5;
export const IDLE_TIMEOUT_DISCONNECT_MS = IDLE_TIMEOUT * 1e3;
export const TIMEFRAME_PING_DISCONNECT_MS = TIMEFRAME_PING_DISCONNECT * 1e3;
export const IDLE_TIMEOUT_PING_MS = IDLE_TIMEOUT_DISCONNECT_MS - TIMEFRAME_PING_DISCONNECT_MS;

export const GROUP_BROADCAST: string = 'broadcast';
export const GROUP_PREFIX: string = 'g-';

export const LISTENER_OPTIONS_ONCE = {
	once: true,
};
