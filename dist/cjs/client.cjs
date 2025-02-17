"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtWSClient = void 0;
const neoevents_1 = require("neoevents");
const nanoid_1 = require("nanoid");
const consts_js_1 = require("./consts.cjs");
const event_js_1 = require("./event.cjs");
const json_js_1 = require("./payload/json.cjs");
const types_js_1 = require("./payload/types.cjs");
const nanoid = (0, nanoid_1.customAlphabet)('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16);
class ExtWSClient extends neoevents_1.NeoEventTarget {
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
        this.addToGroup(consts_js_1.GROUP_PREFIX + group_id);
    }
    // eslint-disable-next-line class-methods-use-this
    addToGroup(_group_id) {
        throw new Error('Method "addToGroup(group_id)" must be defined by ExtWSClient extension.');
    }
    leave(group_id) {
        this.removeFromGroup(consts_js_1.GROUP_PREFIX + group_id);
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
        this.sendPayload((0, json_js_1.buildPayload)(types_js_1.PayloadType.MESSAGE, arg0, arg1));
    }
    ping() {
        this.sendPayload((0, json_js_1.buildPayload)(types_js_1.PayloadType.PING));
    }
    is_disconnected = false;
    /**
     * Disconnects client.
     * @param _is_disconnected - If true, client is already disconnected from the Websocket server.
     */
    disconnect(_is_disconnected = false) {
        if (this.is_disconnected === false) {
            const event = new event_js_1.ExtWSEvent('disconnect', this, undefined);
            this.dispatchEvent(event);
            this.server.dispatchEvent(event);
            this.is_disconnected = true;
            this.destroy();
        }
        this.server.clients.delete(this.id);
    }
}
exports.ExtWSClient = ExtWSClient;
