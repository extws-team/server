import { NeoEvent } from 'neoevents';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ExtWSEvent extends NeoEvent {
    client;
    data;
    constructor(type, client, data) {
        super(type, data);
        this.client = client;
        this.data = data;
    }
}
