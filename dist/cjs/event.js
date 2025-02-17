"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtWSEvent = void 0;
const neoevents_1 = require("neoevents");
class ExtWSEvent extends neoevents_1.NeoEvent {
    client;
    constructor(type, client, data) {
        super(type, data);
        this.client = client;
    }
}
exports.ExtWSEvent = ExtWSEvent;
