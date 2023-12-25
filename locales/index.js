/**
 * Languages Loader
 */

import * as fs from 'node:fs';
import * as yaml from 'js-yaml';

const merge = (...args) => args.reduce((a, c) => ({
	...a,
	...c,
	...Object.entries(a)
		.filter(([k]) => c && typeof c[k] === 'object')
		.reduce((a, [k, v]) => (a[k] = merge(v, c[k]), a), {})
}), {});

const languages = [
	'tr-TR',
	'en-US',
];

const primaries = {
	'en': 'US',
	'tr': 'TR',
};

// 何故か文字列にバックスペース文字が混入することがあり、YAMLが壊れるので取り除く
const clean = (text) => text.replace(new RegExp(String.fromCodePoint(0x08), 'g'), '');

export function build() {
	const locales = languages.reduce((a, c) => (a[c] = yaml.load(clean(fs.readFileSync(new URL(`${c}.yml`, import.meta.url), 'utf-8'))) || {}, a), {});

	// 空文字列が入ることがあり、フォールバックが動作しなくなるのでプロパティごと消す
	const removeEmpty = (obj) => {
		for (const [k, v] of Object.entries(obj)) {
			if (v === '') {
				delete obj[k];
			} else if (typeof v === 'object') {
				removeEmpty(v);
			}
		}
		return obj;
	};
	removeEmpty(locales);

	return Object.entries(locales)
		.reduce((a, [k, v]) => (a[k] = (() => {
			const [lang] = k.split('-');
			switch (k) {
				case 'en-US': return merge(locales['tr-TR'], v);
				default: return locales['tr-TR']
			}
		})(), a), {});
}

export default build();