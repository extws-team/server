import { NeoEvent, NeoEventTarget } from "neoevents";
import { IP } from "@kirick/ip";

//#region src/client.d.ts
interface ExtWSClientStat {
  ts_last_active: number;
}
interface ClientOptions {
  url: URL;
  headers: Headers;
  ip: IP;
}
declare class ExtWSClient extends NeoEventTarget {
  id: string;
  server: ExtWS;
  url: URL;
  headers: Headers;
  ip: IP;
  stat: ExtWSClientStat;
  constructor(server: ExtWS, {
    url,
    headers,
    ip
  }: ClientOptions);
  join(group_id: string): void;
  protected addToChannel(_channel_id: string): void;
  leave(group_id: string): void;
  protected removeFromChannel(_channel_id: string): void;
  protected sendPayload(_payload: string): void;
  send(): void;
  send(event_type: string): void;
  send(data: PayloadData): void;
  send(event_type: string, data: PayloadData): void;
  send(arg0?: string | PayloadData, arg1?: PayloadData): void;
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
declare class ExtWSEvent<D = unknown> extends NeoEvent<D> {
  client: ExtWSClient;
  constructor(type: string, client: ExtWSClient, data: D);
}
//#endregion
//#region src/payload/outcome-event.d.ts
declare enum OutcomePayloadEventType {
  SOCKET = "p.socket",
  CHANNEL = "p.channel",
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
type EventMap = {
  connect: ExtWSEvent<undefined>;
  disconnect: ExtWSEvent<undefined>;
  [OutcomePayloadEventType.SOCKET]: OutcomePayloadSocketEvent;
  [OutcomePayloadEventType.CHANNEL]: OutcomePayloadChannelEvent;
} & {
  [key: string]: ExtWSEvent;
};
declare class ExtWS extends NeoEventTarget<EventMap> {
  clients: Map<string, ExtWSClient>;
  has_adapter: boolean;
  constructor();
  protected onConnect(client: ExtWSClient): void;
  protected onMessage(client: ExtWSClient, payload: string | Buffer): void;
  sendToSocket(socket_id: string): void;
  sendToSocket(socket_id: string, event_type: string): void;
  sendToSocket(socket_id: string, data: PayloadData): void;
  sendToSocket(socket_id: string, event_type: string, data: PayloadData): void;
  sendToGroup(group_id: string): void;
  sendToGroup(group_id: string, event_type: string): void;
  sendToGroup(group_id: string, data: PayloadData): void;
  sendToGroup(group_id: string, event_type: string, data: PayloadData): void;
  broadcast(): void;
  broadcast(event_type: string): void;
  broadcast(data: PayloadData): void;
  broadcast(event_type: string, data: PayloadData): void;
  /**
  * Sends a message to a specific group of clients. THis method should be implemented by WebSocket server implementation.
  * @param _channel_id -
  * @param _payload -
  */
  protected publish(_channel_id: string, _payload: string): void;
  private deferClientsWatch;
  private pingSilentClients;
  private disconnectDeadClients;
  close(): Promise<void>;
}
//#endregion
//#region src/payload/types.d.ts
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
  MESSAGE = 4,
}
type ExtWSOnBeforeUpgradeHandler = (options: {
  url: ExtWSClient["url"];
  headers: ExtWSClient["headers"];
  ip: ExtWSClient["ip"];
}) => Promisable<Response | undefined>;
//#endregion
export { Promisable as a, OutcomePayloadEventType as c, ExtWSClient as d, PayloadType as i, OutcomePayloadSocketEvent as l, Payload as n, ExtWS as o, PayloadData as r, OutcomePayloadChannelEvent as s, ExtWSOnBeforeUpgradeHandler as t, ExtWSEvent as u };