import type * as Yanki from 'misskey-js';

export type SwMessageOrderType = 'post' | 'push';

export type SwMessage = {
	type: 'order';
	order: SwMessageOrderType;
	loginId?: string;
	url: string;
	[x: string]: unknown;
};

// Defined also @/core/PushNotificationService.ts#L12
type PushNotificationDataSourceMap = {
	notification: Yanki.entities.Notification;
	unreadAntennaNote: {
		antenna: { id: string; name: string };
		note: Yanki.entities.Note;
	};
	readAllNotifications: undefined;
};

export type PushNotificationData<K extends keyof PushNotificationDataSourceMap> = {
	type: K;
	body: PushNotificationDataSourceMap[K];
	userId: string;
	dateTime: number;
};

export type PushNotificationDataMap = {
	[K in keyof PushNotificationDataSourceMap]: PushNotificationData<K>;
};

export type BadgeNames =
	| 'null'
	| 'antenna'
	| 'arrow-back-up'
	| 'at'
	| 'chart-arrows'
	| 'circle-check'
	| 'medal'
	| 'messages'
	| 'plus'
	| 'quote'
	| 'repeat'
	| 'user-plus'
	| 'users';
