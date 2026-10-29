# @extws/server

WebSocket server framework that defines a custom message protocol for WebSocket communication expanding its capabilities.

## Features

- 🚀 Lightweight and efficient message protocol
- 👥 Group messaging system
- 🔄 Automatic connection management
- 🎯 Type-safe event handling
- 🔐 Typed data attached to each client, such as a session
- 📦 Framework-agnostic core
- 🔌 Automatic handling of broken or silently disconnected clients
- 📡 Scaling across multiple servers with adapters

## Installation

```bash
pnpm install @extws/server
# or
bun install @extws/server
# or
npm install @extws/server
```

## Protocol

ExtWS uses a custom message protocol that consists of:

```
{payload_type}{event_type?}{json_data?}
```

where:
- `payload_type` - single digit defining message type: `1` for connection init, `2` for ping, `3` for pong, `4` for event
- `event_type` - optional string (max 31 chars, cannot contain `{` or `[`) defining custom event type
- `json_data` - optional JSON payload, an object or an array

This protocol was invented to make it possible to subscribe to different types of events (`event_type`) instead of listening to all messages using the `message` event of the WebSocket. This allows for more organized and efficient event handling. The `payload_type` is used to differentiate between internal messages and actual events.

Example messages:
```
4chat{"message":"Hello world"}  // Event with type 'chat'
4{"data":"Simple message"}      // Event with type 'message' (by default)
```

## Usage

This package is not a WebSocket server itself, but rather a framework for building WebSocket servers. It defines the protocol for ExtWS communication and core logic, while the actual server implementation is up to the developer.

To create your own WebSocket server using this framework, you need to extend the `ExtWS` class and implement the WebSocket server-specific methods. This approach allows you to use any WebSocket server library (like uWebSockets, ws, or build-in WebSocket server in runtimes like Deno or Bun) while maintaining a consistent protocol and feature set.

If you are looking for ready-to-use implementation, check packages from our team:
- [@extws/server-bun](https://github.com/extws-team/server-bun) built on top of [Bun](https://bun.sh/docs/api/websockets)
- [@extws/server-uws](https://github.com/extws-team/server-uws) built on top of [uWebSockets.js](https://github.com/uNetworking/uWebSockets.js)
- [@extws/client](https://github.com/extws-team/client) to connect to ExtWS servers from browsers, Node.js and Bun
- [@extws/adapter-redis](https://github.com/extws-team/adapter-redis) to scale ExtWS servers using Redis

### Creating server

To create an ExtWS server, you need to integrate both ExtWS server and ExtWS client with a WebSocket server of your choice. ExtWS provides core messaging protocol and features, while leaving actual WebSocket server implementation up to you. So, you need to create a WebSocket server and then tie it to ExtWS.

Here's an example showing integration pattern using a pseudo WebSocket server:

```typescript
import { ExtWS, ExtWSClient } from '@extws/server';
import type { ExtWSOptions } from '@extws/server/dev';
import { IP } from '@kirick/ip';
import {
  FooBarWebSocketServer,
  type FooBarWebSocketClient,
} from '@foobar/websocket-server'; // import WebSocket server you want or use built-in one

// Integrate ExtWS client and real WebSocket client
class MyExtWSClient extends ExtWSClient {
  private ws_socket: FooBarWebSocketClient;

  constructor(
    server: MyServer,
    ws_socket: FooBarWebSocketClient,
  ) {
    // Call super constructor, pass the server and client data
    super(
      server,
      // extract client metadata from WebSocket client or somehow else
      {
        url: new URL(ws_socket.url),
        headers: new Headers(ws_socket.headers),
        ip: new IP(ws_socket.ip),
        // data attached to the client, see "Client data" below
        data: undefined,
      },
    );

    this.ws_socket = ws_socket;
  }

  // Methods below are called by ExtWS itself.
  // Mark them as `@internal` and enable `stripInternal` in tsconfig.json,
  // so they do not show up in your package's type declarations.

  // Implement channels, ExtWS uses them for groups and broadcasting
  /** @internal */
  addToChannel(channel_id: string) {
    this.ws_socket.subscribe(channel_id);
  }
  /** @internal */
  removeFromChannel(channel_id: string) {
    this.ws_socket.unsubscribe(channel_id);
  }

  // Implement sending messages
  // `payload` here is an encoded ExtWS message
  /** @internal */
  sendPayload(payload: string) {
    this.ws_socket.send(payload);
  }

  // Implement disconnect
  override disconnect() {
    this.ws_socket.close();

    // Let ExtWS emit the `disconnect` event and forget the client
    super.disconnect();
  }
}

// Integrate ExtWS server and real WebSocket server
class MyServer extends ExtWS {
  private ws_server: FooBarWebSocketServer;

  constructor({ port, ...options }: { port: number } & ExtWSOptions) {
    // Pass `idleTimeout` and `pingTimeout` to ExtWS
    super(options);

    // Create actual WebSocket server instance
    this.ws_server = new FooBarWebSocketServer({ port });

    // Create bindings between ExtWS and WebSocket server
    this.ws_server.on('connection', (ws_socket) => {
      // When new client is connected, create your server's client object
      const client = new MyExtWSClient(this, ws_socket);

      // Notify ExtWS that a new connection has been established
      this.onConnect(client);

      // Forward WebSocket messages to ExtWS
      // ExtWS will parse the message and do the right thing
      ws_socket.on('message', (data) => {
        this.onMessage(client, data);
      });

      // Handle client disconnection
      ws_socket.on('close', () => {
        // Notify ExtWS that a client has disconnected
        client.disconnect();
      });
    });
  }

  // Implement channel messaging, ExtWS uses it for groups and broadcasting
  /** @internal */
  publish(channel_id: string, payload: string) {
    // Use WebSocket server's capabilities to send message to a specific channel (subset of clients)
    this.ws_server.publish(channel_id, payload);
    // if your server doesn't support channels, you should implement the logic yourself (hello, `ws`)
  }

  // Implement stopping the server
  override async close() {
    await this.ws_server.close();

    // Let ExtWS stop its timers and remove event listeners
    await super.close();
  }
}

const server = new MyServer({ port: 8080 });
```

### Client data

Both `ExtWS` and `ExtWSClient` accept a type parameter `TData` describing data attached to each client as `client.data`. It is usually produced while upgrading a connection, for example a session parsed from cookies.

Server implementations accept the `onBeforeUpgrade` hook to produce that data. Use the `ExtWSOnBeforeUpgradeOptions<TData>` type from `@extws/server/dev` to declare it: the hook returns a `Response` to reject the upgrade, or the data to attach to the client. The hook becomes required once `TData` does not allow `undefined`.

```typescript
import type { ExtWSOnBeforeUpgradeOptions, ExtWSOptions } from '@extws/server/dev';

class MyServer<
  TData extends Record<string, unknown> | undefined = undefined,
> extends ExtWS<TData> {
  constructor(
    options: { port: number } & ExtWSOptions & ExtWSOnBeforeUpgradeOptions<TData>,
  ) {
    // ...
  }
}
```

### Options

All server implementations accept these options and pass them to `ExtWS`:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `idleTimeout` | `number` | `60` | Seconds a client may stay silent before it is disconnected. |
| `pingTimeout` | `number` | `5` | Seconds a client has to answer a ping from the server. Must be less than `idleTimeout`. |

ExtWS detects clients that are gone without closing the connection. Once a client has been silent for `idleTimeout - pingTimeout` seconds, the server pings it, and disconnects the client if it does not answer within `pingTimeout` seconds. The server also sends `idleTimeout` to every client when it connects, so [@extws/client](https://github.com/extws-team/client) can detect a server that went silent.

## Handling events

The key feature of ExtWS is its custom message protocol that allows efficient work with typed events. Instead of listening to all messages through a single WebSocket `message` event, ExtWS allows you to subscribe to specific event types.

### Event subscription

To listen for events sent by the client, use the `on` method:

```typescript
// Subscribe to all messages with type 'chat'
server.on('chat', (event) => {
  console.log('Chat message:', event.detail);
  console.log('From client:', event.client.id);
});
```

Event data is sent by the client, so `event.detail` is typed as `unknown`. Validate it before use with libraries like [valibot](https://github.com/valibot/valibot), [zod](https://github.com/colinhacks/zod) or similar:

```typescript
import * as v from 'valibot';

const ChatMessageSchema = v.object({
  message: v.string(),
  timestamp: v.number(),
});

server.on('chat', (event) => {
  const chat_message = v.parse(ChatMessageSchema, event.detail);

  console.log(chat_message.message);
  console.log(chat_message.timestamp);
});
```

To create one-time subscriptions, use `once` or `wait` methods:

```typescript
// Subscription will trigger only once
server.once('user:ready', (event) => {
  console.log(`User ${event.client.id} is ready`);
});

// wait() is essentially the same as once() but returns a Promise instead of using a callback
const event = await server.wait('user:ready');
console.log(`User ${event.client.id} is ready`);
```

### Built-in events

ExtWS has several built-in events that cannot be used for event types:

```typescript
// New client connected
server.on('connect', (event) => {
  console.log('New client connected:', event.client.id);
});

// Client disconnected
server.on('disconnect', (event) => {
  console.log('Client disconnected:', event.client.id);
});
```

### Unsubscribing from events

Methods `on` and `once` return a function that, when called, removes the event subscription:

```typescript
const off = server.on('message', (event) => {
  console.log(event.detail);
});

// Remove event subscription
off();
```

## Sending messages

ExtWS provides several ways to send messages: directly through the client or via the server.

#### To a specific client

If you have a client object, you can use the `send` method:

```typescript
client.send({ message: 'hello' }); // event of type 'message'
client.send('chat', { message: 'hello' }); // event of type 'chat'
client.send('typing'); // event of type 'typing' without data
client.send(); // event of type 'message' without data
```

If you have only the client ID, call the `sendToSocket` method on the server:

```typescript
const client_id = 'deadbeef';

server.sendToSocket(client_id, { message: 'hello' }); // event of type 'message'
server.sendToSocket(client_id, 'chat', { message: 'hello' }); // event of type 'chat'
server.sendToSocket(client_id, 'typing'); // event of type 'typing' without data
server.sendToSocket(client_id); // event of type 'message' without data
```

#### To a group of clients

To send a message to a group of clients, use the `sendToGroup` method on the server:

```typescript
server.sendToGroup('room1', { message: 'hello' }); // event of type 'message'
server.sendToGroup('room1', 'chat', { message: 'hello' }); // event of type 'chat'
server.sendToGroup('room1', 'typing'); // event of type 'typing' without data
server.sendToGroup('room1'); // event of type 'message' without data
```

#### To all clients of the server

To send a message to all clients, use the `broadcast` method on the server:

```typescript
server.broadcast({ message: 'hello' }); // event of type 'message'
server.broadcast('chat', { message: 'hello' }); // event of type 'chat'
server.broadcast('typing'); // event of type 'typing' without data
server.broadcast(); // event of type 'message' without data
```

Event types that break the protocol, longer than 31 characters or containing `{` or `[`, make these methods throw a `TypeError`.

## Groups

ExtWS has a built-in group system that allows organizing clients into logical groups for convenient message delivery to multiple clients simultaneously. Groups are identified by a string ID. Of course, client can be in multiple groups simultaneously.

```typescript
// Add client to group
client.join('room1');

// Send message to all clients in room1
server.sendToGroup('room1', 'chat', { message: 'Hello room!' });

// Remove client from group
client.leave('room1');
```

## Scaling

A single server only reaches its own clients. To run several servers and still reach every client from any of them, connect the servers with an adapter, such as [@extws/adapter-redis](https://github.com/extws-team/adapter-redis). Then `sendToSocket`, `sendToGroup` and `broadcast` deliver messages to clients of all connected servers.

## Stopping the server

To stop the server, call the `close` method:

```typescript
await server.close();
```
