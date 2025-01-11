# @extws/server

WebSocket server framework that defines a custom message protocol for WebSocket communication expanding its capabilities.

## Features

- 🚀 Lightweight and efficient message protocol
- 👥 Group messaging system
- 🔄 Automatic connection management
- 🎯 Type-safe event handling
- 📦 Framework-agnostic core
- 🔌 Automatic handling of broken or silently disconnected clients

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
- `payload_type` - single digit defining message type (1-4)
- `event_type` - optional string (max 31 chars) defining custom event type
- `json_data` - optional JSON payload

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

### Creating server

To create an ExtWS server, you need to integrate both ExtWS server and ExtWS client with a WebSocket server of your choice. ExtWS provides core messaging protocol and features, while leaving actual WebSocket server implementation up to you. So, you need to create a WebSocket server and then tie it to ExtWS.

Here's an example showing integration pattern using a pseudo WebSocket server:

```typescript
import { ExtWS, ExtWSClient } from '@extws/server';
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
        url: new URL(socket.url),
        headers: new Map(socket.headers),
        ip: new IP(socket.ip),
      },
    );

    this.ws_socket = ws_socket;
  }

  // Implement groups
  protected addToGroup(group_id: string) {
    this.ws_socket.join(group_id);
  }
  protected removeFromGroup(group_id: string) {
    this.ws_socket.leave(group_id);
  }

  // Implement sending messages
  // `payload` here is an encoded ExtWS message
  protected sendPayload(payload: string) {
    this.ws_socket.send(payload);
  }

  // Implement disconnect
  disconnect() {
    this.ws_socket.disconnect();
  }
}

// Integrate ExtWS server and real WebSocket server
class MyServer extends ExtWS {
  private ws_server: FooBarWebSocketServer;

  constructor({ port }: { port: number }) {
    super();

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
      socket.on('message', (data) => {
        this.onMessage(client, data);
      });

      // Handle client disconnection
      socket.on('disconnect', () => {
        // Notify ExtWS that a client has disconnected
        client.disconnect();
      });
    });
  }

  // Implement group/broadcast messaging
  // ExtWS calls this method when sending messages to groups
  protected publish(channel: string, payload: string) {
    // Use WebSocket server's capabilities to send message to a specific group (subset of clients)
    this.ws_server.publish(channel, payload);
    // if your server doesn't support groups, you should implement the logic yourself (hello, `ws`)
  }
}

const server = new MyServer();
```

## Handling events

The key feature of ExtWS is its custom message protocol that allows efficient work with typed events. Instead of listening to all messages through a single WebSocket `message` event, ExtWS allows you to subscribe to specific event types.

### Event subscription

To listen for events sent by the client, use the `on` method:

```typescript
// Subscribe to all messages with type 'chat'
server.on('chat', (event) => {
  console.log('Chat message:', event.data);
  console.log('From client:', event.client.id);
});
```

If you are using TypeScript, you can specify the type of the event data:

```typescript
import type { ExtWSEvent } from '@extws/server';

interface ChatMessage {
  message: string;
  timestamp: number;
}

// Typed event subscription
server.on<ExtWSEvent<ChatMessage>>('chat', (event) => {
  // event.data is typed as ChatMessage
  console.log(event.data.message);
  console.log(event.data.timestamp);
});
```

> [!WARNING]
> However, because the data is sent from the client, it is better to validate the incoming data using libraries like [valibot](https://github.com/valibot/valibot), [zod](https://github.com/colinhacks/zod) or similar.

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
  console.log(event.data);
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
