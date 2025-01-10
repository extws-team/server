import { NeoEventTarget } from 'neoevents';
import { customAlphabet } from 'nanoid';
import { GROUP_PREFIX } from './consts.js';
import { ExtWSEvent } from './event.js';
import { buildPayload } from './payload/json.js';
import { PayloadType, } from './payload/types.js';
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16);
export class ExtWSClient extends NeoEventTarget {
    id;
    server;
    url;
    headers; // Headers;
    ip;
    stat = {
        ts_last_active: Date.now(),
    };
    constructor(server, { url, headers, ip, }) {
        super();
        this.id = nanoid();
        this.server = server;
        this.url = url;
        this.headers = headers;
        this.ip = ip;
    }
    join(group_id) {
        this.addToGroup(GROUP_PREFIX + group_id);
    }
    // eslint-disable-next-line class-methods-use-this
    addToGroup(_group_id) {
        throw new Error('Method "addToGroup(group_id)" must be defined by ExtWSClient extension.');
    }
    leave(group_id) {
        this.removeFromGroup(GROUP_PREFIX + group_id);
    }
    // eslint-disable-next-line class-methods-use-this
    removeFromGroup(_group_id) {
        throw new Error('Method "removeFromGroup(group_id)" must be defined by ExtWSClient extension.');
    }
    // eslint-disable-next-line class-methods-use-this
    sendPayload(_payload) {
        throw new Error('Method "sendPayload(payload)" must be defined by ExtWSClient extension.');
    }
    send(arg0, arg1) {
        this.sendPayload(buildPayload(PayloadType.MESSAGE, arg0, arg1));
    }
    ping() {
        this.sendPayload(buildPayload(PayloadType.PING));
    }
    is_disconnected = false;
    /**
     * Disconnects client.
     * @param _is_disconnected - If true, client is already disconnected from the Websocket server.
     */
    disconnect(_is_disconnected = false) {
        if (this.is_disconnected === false) {
            const event = new ExtWSEvent('disconnect', this, undefined);
            this.dispatchEvent(event);
            this.server.dispatchEvent(event);
            this.is_disconnected = true;
            this.destroy();
        }
        this.server.clients.delete(this.id);
    }
}
