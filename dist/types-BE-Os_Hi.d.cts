import { NeoEvent, NeoEventTarget } from "neoevents";
import { IP } from "@kirick/ip";
//#region src/event.d.ts
declare class ExtWSEvent<D = unknown, ClientData = unknown> extends NeoEvent<D> {
  client: ExtWSClient<ClientData>;
  constructor(type: string, client: ExtWSClient<ClientData>, data: D);
}
//#endregion
//#region src/client.d.ts
interface ExtWSClientStat {
  ts_last_active: number;
  ts_pinged_for_activity?: number;
}
interface ClientBaseOptions {
  url: URL;
  headers: Headers;
  ip: IP;
}
type ClientOptions<ClientData = undefined> = ClientBaseOptions & (undefined extends ClientData ? {
  data?: ClientData;
} : {
  data: ClientData;
});
type ExtWSClientEventMap<ClientData> = {
  connect: ExtWSEvent<undefined, ClientData>;
  disconnect: ExtWSEvent<undefined, ClientData>;
} & Record<string, ExtWSEvent<unknown, ClientData>>;
declare class ExtWSClient<ClientData = undefined> extends NeoEventTarget<ExtWSClientEventMap<ClientData>> {
  id: string;
  server: ExtWS<ClientData>;
  url: URL;
  headers: Headers;
  ip: IP;
  data: ClientData;
  stat: ExtWSClientStat;
  constructor(server: ExtWS<ClientData>, options: ClientOptions<ClientData>);
  join(group_id: string): void;
  protected addToChannel(_channel_id: string): void;
  leave(group_id: string): void;
  protected removeFromChannel(_channel_id: string): void;
  protected sendPayload(_payload: string): void;
  send(event_type_or_data?: PayloadData): void;
  send(event_type: string, data: PayloadData): void;
  ping(): void;
  protected closeTransport(): void;
  private connection_state;
  /** Requests physical transport close and finalizes the core lifecycle. */
  disconnect(): void;
  /** Finalizes the core lifecycle after the transport closes externally. */
  transportClosed(): void;
  private finalizeDisconnect;
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
interface ExtWSHealthcheckOptions {
  idle_timeout?: number;
  timeframe_ping_disconnect?: number;
}
interface ExtWSOptions {
  healthcheck?: ExtWSHealthcheckOptions;
}
interface ExtWSHealthcheck {
  idle_timeout: number;
  timeframe_ping_disconnect: number;
  idle_timeout_disconnect_ms: number;
  timeframe_ping_disconnect_ms: number;
  idle_timeout_ping_ms: number;
}
type ExtWSEventMap<ClientData> = {
  connect: ExtWSEvent<undefined, ClientData>;
  disconnect: ExtWSEvent<undefined, ClientData>;
  [OutcomePayloadEventType.SOCKET]: OutcomePayloadSocketEvent;
  [OutcomePayloadEventType.CHANNEL]: OutcomePayloadChannelEvent;
} & Record<string, ExtWSEvent<unknown, ClientData>>;
declare class ExtWS<ClientData = undefined> extends NeoEventTarget<ExtWSEventMap<ClientData>> {
  clients: Map<string, ExtWSClient<ClientData>>;
  has_adapter: boolean;
  readonly healthcheck: ExtWSHealthcheck;
  private healthcheck_timeout?;
  private is_closed;
  constructor({ healthcheck }?: ExtWSOptions);
  /**
   * Removes state created by a failed client initialization.
   * @param client Client whose initialization failed.
   * @param initialization_error Error raised by the transport hook.
   */
  private rollbackClientConnection;
  protected onConnect(client: ExtWSClient<ClientData>): void;
  protected onMessage(client: ExtWSClient<ClientData>, payload: string | Buffer): void;
  sendToSocket(socket_id: string, event_type_or_data?: PayloadData): void;
  sendToSocket(socket_id: string, event_type: string, data: PayloadData): void;
  sendToGroup(group_id: string, event_type_or_data?: PayloadData): void;
  sendToGroup(group_id: string, event_type: string, data: PayloadData): void;
  broadcast(event_type_or_data?: PayloadData): void;
  broadcast(event_type: string, data: PayloadData): void;
  /**
   * Sends a message to a specific group of clients. THis method should be implemented by WebSocket server implementation.
   * @param _channel_id -
   * @param _payload -
   */
  protected publish(_channel_id: string, _payload: string): void;
  private scheduleHealthcheck;
  private checkClientsHealth;
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
  url: ExtWSClient<ClientData>["url"];
  headers: ExtWSClient<ClientData>["headers"];
  ip: ExtWSClient<ClientData>["ip"];
}) => Promisable<Response | ClientData>;
//#endregion
export { ExtWSClientStat as _, Promisable as a, ExtWSHealthcheck as c, OutcomePayloadChannelEvent as d, OutcomePayloadEventType as f, ExtWSClientEventMap as g, ExtWSClient as h, PayloadType as i, ExtWSHealthcheckOptions as l, ClientOptions as m, Payload as n, ExtWS as o, OutcomePayloadSocketEvent as p, PayloadData as r, ExtWSEventMap as s, ExtWSOnBeforeUpgradeHandler as t, ExtWSOptions as u, ExtWSEvent as v };