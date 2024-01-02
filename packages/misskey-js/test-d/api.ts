import { expectType } from 'tsd';
import * as Yanki from '../src';

describe('API', () => {
	test('success', async () => {
		const cli = new Yanki.api.APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN'
		});
		const res = await cli.request('meta', { detail: true });
		expectType<Yanki.entities.DetailedInstanceMetadata>(res);
	});

	test('conditional respose type (meta)', async () => {
		const cli = new Yanki.api.APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN'
		});

		const res = await cli.request('meta', { detail: true });
		expectType<Yanki.entities.DetailedInstanceMetadata>(res);

		const res2 = await cli.request('meta', { detail: false });
		expectType<Yanki.entities.LiteInstanceMetadata>(res2);

		const res3 = await cli.request('meta', { });
		expectType<Yanki.entities.LiteInstanceMetadata>(res3);

		const res4 = await cli.request('meta', { detail: true as boolean });
		expectType<Yanki.entities.LiteInstanceMetadata | Yanki.entities.DetailedInstanceMetadata>(res4);
	});

	test('conditional respose type (users/show)', async () => {
		const cli = new Yanki.api.APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN'
		});

		const res = await cli.request('users/show', { userId: 'xxxxxxxx' });
		expectType<Yanki.entities.UserDetailed>(res);

		const res2 = await cli.request('users/show', { userIds: ['xxxxxxxx'] });
		expectType<Yanki.entities.UserDetailed[]>(res2);
	});
});
