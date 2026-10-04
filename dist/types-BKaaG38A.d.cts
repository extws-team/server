import { NeoEvent, NeoEventTarget } from "neoevents";
import { IP } from "@kirick/ip";
//#region src/client.d.ts
interface ExtWSClientStat {
  ts_last_active: number;
}
interface BaseClientOptions {
  url: URL;
  headers: Headers;
  ip: IP;
}
type ClientOptions<ClientData = undefined> = BaseClientOptions & ([ClientData] extends [undefined] ? {
  data?: undefined;
} : {
  data: ClientData;
});
declare class ExtWSClient<ClientData = undefined> extends NeoEventTarget {
  readonly data: ClientData;
  id: string;
  server: ExtWS<ClientData>;
  url: URL;
  headers: Headers;
  ip: IP;
  stat: ExtWSClientStat;
  constructor(server: ExtWS<ClientData>, { url, headers, ip, data }: ClientOptions<ClientData>);
  join(group_id: string): void;
  /** @internal */
  _addToChannel(_channel_id: string): void;
  leave(group_id: string): void;
  /** @internal */
  _removeFromChannel(_channel_id: string): void;
  /** @internal */
  _sendPayload(_payload: string): void;
  send(event_type_or_data?: string | PayloadData, data?: PayloadData): void;
  ping(): void;
  private is_disconnected;
  /**
   * Disconnects client.
   * @param _is_disconnected - If true, client is already disconnected from the Websocket server.
   */
  disconnect(_is_disconnected?: boolean): void;
}
//#endregion
//#region src/event.d.ts
declare class ExtWSEvent<D = unknown, ClientData = undefined> extends NeoEvent<D> {
  client: ExtWSClient<ClientData>;
  constructor(type: string, client: ExtWSClient<ClientData>, data: D);
}
//#endregion
//#region src/payload/outcome-event.d.ts
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
//#endregion
//#region src/main.d.ts
type EventMap<ClientData> = {
  connect: ExtWSEvent<undefined, ClientData>;
  disconnect: ExtWSEvent<undefined, ClientData>;
  [OutcomePayloadEventType.SOCKET]: OutcomePayloadSocketEvent;
  [OutcomePayloadEventType.CHANNEL]: OutcomePayloadChannelEvent;
} & Record<string, ExtWSEvent<unknown, ClientData>>;
interface ExtWSHealthcheck {
  idle_timeout: number;
  timeframe_ping_disconnect: number;
  timeframe_ping_disconnect_ms: number;
  idle_timeout_disconnect_ms: number;
  idle_timeout_ping_ms: number;
}
declare class ExtWS<ClientData = undefined> extends NeoEventTarget<EventMap<ClientData>> {
  clients: Map<string, ExtWSClient<ClientData>>;
  has_adapter: boolean;
  private healthcheck;
  private clients_watch_timer;
  private clients_watch_stopped;
  constructor({ idle_timeout }?: {
    idle_timeout?: number;
  });
  protected onConnect(client: ExtWSClient<ClientData>): void;
  protected onMessage(client: ExtWSClient<ClientData>, payload: string | Buffer): void;
  sendToSocket(socket_id: string, event_type_or_data?: string | PayloadData): void;
  sendToSocket(socket_id: string, event_type: string, data: PayloadData): void;
  sendToGroup(group_id: string, event_type_or_data?: string | PayloadData): void;
  sendToGroup(group_id: string, event_type: string, data: PayloadData): void;
  broadcast(event_type_or_data?: string | PayloadData): void;
  broadcast(event_type: string, data: PayloadData): void;
  /**
   * Sends a message to a specific group of clients. THis method should be implemented by WebSocket server implementation.
   * @param _channel_id -
   * @param _payload -
   */
  protected publish(_channel_id: string, _payload: string): void;
  _deferClientsWatch(): void;
  _pingSilentClients(): void;
  protected stopClientsWatch(): void;
  _disconnectDeadClients(): void;
  close(): Promise<void>;
}
//#endregion
//#region src/payload/types.d.ts
type Promisable<T> = T | Promise<T>;
type PayloadData = Record<string, unknown> | unknown[] | string;
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
type ExtWSOnBeforeUpgradeHandler<ClientData = undefined> = (options: {
  url: ExtWSClient["url"];
  headers: ExtWSClient["headers"];
  ip: ExtWSClient["ip"];
}) => Promisable<Response | ([ClientData] extends [undefined] ? undefined : {
  data: ClientData;
})>;
//#endregion
export { Promisable as a, OutcomePayloadChannelEvent as c, ExtWSEvent as d, ExtWSClient as f, PayloadType as i, OutcomePayloadEventType as l, Payload as n, ExtWS as o, PayloadData as r, ExtWSHealthcheck as s, ExtWSOnBeforeUpgradeHandler as t, OutcomePayloadSocketEvent as u };