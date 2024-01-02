import * as Yanki from 'misskey-js';
import { markRaw } from 'vue';
import { $i } from '@/account';
import { url } from '@/config';

let stream: Yanki.Stream | null = null;

export function useStream(): Yanki.Stream {
	if (stream) return stream;

	stream = markRaw(new Yanki.Stream(url, $i ? {
		token: $i.token,
	} : null));

	window.setTimeout(heartbeat, 1000 * 60);

	return stream;
}

function heartbeat(): void {
	if (stream != null && document.visibilityState === 'visible') {
		stream.heartbeat();
	}
	window.setTimeout(heartbeat, 1000 * 60);
}
