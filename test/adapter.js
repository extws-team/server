
export default class ExtWSTestAdapter extends EventTarget {
	publish(...args) {
		const event = new Event('test.publish');
		event.args = args;

		this.dispatchEvent(event);
	}
}
