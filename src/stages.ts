import axios from 'axios';
import {URL} from 'url';

export class BaseFetcher<T, U> {
	constructor(
		private readonly url: URL,
		private readonly parser: (item: T) => U,
		private readonly filter: (item: U) => boolean = () => true
	) {}

	async fetch() {
		const res = await axios.get<T[]>(this.url.toString());
		return res.data.map(this.parser).filter(this.filter);
	}
}

export class BaseComparer<U, V> {
	private readonly comparers: Array<(beforeItem: U, afterItem: U) => V>

	constructor(...comparers: Array<(beforeItem: U, afterItem: U) => V>) {
		this.comparers = comparers
	}

	compare(beforeItem: U, afterItem: U) {

	}
}
