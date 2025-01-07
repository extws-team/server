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

### Creating Server

To create an ExtWS server, you need to integrate it with a WebSocket server of your choice. ExtWS provides core messaging protocol and features, while leaving actual WebSocket server implementation up to you. So, you need to create a WebSocket server and then tie it to ExtWS.

Here's an example showing integration pattern using a pseudo WebSocket server:

```typescript
import { ExtWS, ExtWSClient } from '@extws/server';
import { IP } from '@kirick/ip';
import { FooBarWebSocketServer } from '@foobar/websocket-server'; // import WebSocket server you want or use built-in one

class MyServer extends ExtWS {
  private ws_server: FooBarWebSocketServer;

  constructor() {
    super();

    // Create actual WebSocket server instance
    this.ws_server = new FooBarWebSocketServer();

    // Create bindings between ExtWS and WebSocket server
    this.ws_server.on('connection', (socket, request) => {
      // When new client is connected, create ExtWSClient with metadata
      const client = new ExtWSClient(this, {
        url: new URL(request.url),
        headers: request.headers,
        ip: new IP(request.ip),
      });

      // Notify ExtWS that a new connection has been established
      this.onConnect(client);

      // Forward WebSocket messages to ExtWS
      // ExtWS will parse the message and do the right thing
      socket.on('message', (data) => {
        this.onMessage(client, data);
      });
    });
  }

  // Implement group messaging capability
  // ExtWS calls this method when sending messages to groups
  protected publish(channel: string, payload: string) {
    // Use WebSocket server's capabilities to send message to a group
    this.ws_server.publish(channel, payload);
    // if your server doesn't support groups, you should implement the logic yourself (hello, `ws`)
  }
}

const server = new MyServer();
```

### Handling Events

```typescript
const server = new MyServer();

// Listen for connections
server.on('connect', (event) => {
  console.log('New client:', event.client.id);
});

// Listen for messages
server.on('message', (event) => {
  console.log('Message from client:', event.data);
});

// Listen for custom events
server.on('chat', (event) => {
  console.log('Chat message:', event.data);
});
```

### Sending Messages

```typescript
// Send to specific client
server.sendToSocket(client_id, 'event_type', { data: 'hello' });

// Send to group
server.sendToGroup('room1', 'event_type', { data: 'hello' });

// Broadcast to all clients
server.broadcast('event_type', { data: 'hello' });
```

### Groups

```typescript
// Join client to group
client.join('room1');

// Remove client from group
client.leave('room1');
```
