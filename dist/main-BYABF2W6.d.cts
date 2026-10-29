import { NeoEvent, NeoEventTarget } from "neoevents";
import { IP } from "@kirick/ip";
type Promisable<T> = T | Promise<T>;
type PayloadData = Record<string, unknown> | unknown[];
interface Payload {
  payload_type: PayloadType;
  event_type?: string;
  data?: PayloadData;
}
declare enum PayloadType {
  ERROR = -1,
  INIT = 1,
  PING = 2,
  PONG = 3,
  MESSAGE = 4
}
type ExtWSOnBeforeUpgradeHandler<TData> = (options: {
  url: ExtWSClient["url"];
  headers: ExtWSClient["headers"];
  ip: ExtWSClient["ip"];
}) => Promisable<Response | TData>;
/**
 * `onBeforeUpgrade` option of a WebSocket server implementation.
 * Becomes required once `TData` excludes `undefined`, since only the hook can produce the data.
 */
type ExtWSOnBeforeUpgradeOptions<TData extends Record<string, unknown> | undefined> = undefined extends TData ? {
  /** Hook that is called before a WebSocket upgrade. Useful to parse authorization and reject upgrade with custom headers such as `Set-Cookie`. Return a `Response` to reject the upgrade, or data to attach to the client as `client.data`. */
  onBeforeUpgrade?: ExtWSOnBeforeUpgradeHandler<TData>;
} : {
  /** Hook that is called before a WebSocket upgrade. Useful to parse authorization and reject upgrade with custom headers such as `Set-Cookie`. Return a `Response` to reject the upgrade, or data to attach to the client as `client.data`. */
  onBeforeUpgrade: ExtWSOnBeforeUpgradeHandler<TData>;
};
interface ExtWSClientStat {
  ts_last_active: number;
}
interface ClientOptions<TData extends Record<string, unknown> | undefined> {
  url: URL;
  headers: Headers;
  ip: IP;
  data: TData;
}
declare class ExtWSClient<TData extends Record<string, unknown> | undefined = undefined> extends NeoEventTarget {
  #private;
  id: string;
  server: ExtWS<TData>;
  url: URL;
  headers: Headers;
  ip: IP;
  /** Data returned by the `onBeforeUpgrade` hook. */
  data: TData;
  stat: ExtWSClientStat;
  constructor(server: ExtWS<TData>, { url, headers, ip, data }: ClientOptions<TData>);
  join(group_id: string): void;
  leave(group_id: string): void;
  send(data?: PayloadData): void;
  send(event_type: string, data?: PayloadData): void;
  ping(): void;
  /**
   * Disconnects client.
   * @param _is_disconnected - If true, client is already disconnected from the Websocket server.
   */
  disconnect(_is_disconnected?: boolean): void;
}
declare class ExtWSEvent<D = unknown, TData extends Record<string, unknown> | undefined = undefined> extends NeoEvent<D> {
  client: ExtWSClient<TData>;
  constructor(type: string, client: ExtWSClient<TData>, data: D);
}
declare enum OutcomePayloadEventType {
  SOCKET = "p.socket",
  CHANNEL = "p.channel"
}
declare class OutcomePayloadSocketEvent extends NeoEvent<string> {
  socket_id: string;
  constructor(socket_id: string, payload: string);
}
declare class OutcomePayloadChannelEvent extends NeoEvent<string> {
  channel_id: string;
  constructor(channel_id: string, payload: string);
}
type EventMap<TData extends Record<string, unknown> | undefined> = {
  connect: ExtWSEvent<undefined, TData>;
  disconnect: ExtWSEvent<undefined, TData>;
  [OutcomePayloadEventType.SOCKET]: OutcomePayloadSocketEvent;
  [OutcomePayloadEventType.CHANNEL]: OutcomePayloadChannelEvent;
} & Record<string, ExtWSEvent<unknown, TData>>;
declare class ExtWS<TData extends Record<string, unknown> | undefined = undefined> extends NeoEventTarget<EventMap<TData>> {
  #private;
  clients: Map<string, ExtWSClient<TData>>;
  has_adapter: boolean;
  constructor();
  protected onConnect(client: ExtWSClient<TData>): void;
  protected onMessage(client: ExtWSClient<TData>, payload: string | Buffer): void;
  sendToSocket(socket_id: string, data?: PayloadData): void;
  sendToSocket(socket_id: string, event_type: string, data?: PayloadData): void;
  sendToGroup(group_id: string, data?: PayloadData): void;
  sendToGroup(group_id: string, event_type: string, data?: PayloadData): void;
  broadcast(data?: PayloadData): void;
  broadcast(event_type: string, data?: PayloadData): void;
  /**
   * Stops the server. WebSocket server implementation should override this method and call `super.close()` once its own teardown is done.
   * @returns -
   */
  close(): Promise<void>;
}
export { ExtWSEvent as a, ExtWSOnBeforeUpgradeOptions as c, PayloadType as d, Promisable as f, OutcomePayloadSocketEvent as i, Payload as l, OutcomePayloadChannelEvent as n, ExtWSClient as o, OutcomePayloadEventType as r, ExtWSOnBeforeUpgradeHandler as s, ExtWS as t, PayloadData as u };