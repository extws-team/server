import { NeoEvent } from 'neoevents';
import { ExtWSClient } from './main.js';
export declare class ExtWSEvent<D = unknown> extends NeoEvent<D> {
    client: ExtWSClient;
    constructor(type: string, client: ExtWSClient, data: D);
}
