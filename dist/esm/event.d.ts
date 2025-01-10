import { NeoEvent } from 'neoevents';
import { ExtWSClient } from './main.js';
export declare class ExtWSEvent<D = any> extends NeoEvent {
    client: ExtWSClient;
    data: D;
    constructor(type: string, client: ExtWSClient, data: D);
}
