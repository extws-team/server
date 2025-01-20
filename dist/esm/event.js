import { NeoEvent } from 'neoevents';
export class ExtWSEvent extends NeoEvent {
    client;
    constructor(type, client, data) {
        super(type, data);
        this.client = client;
    }
}
