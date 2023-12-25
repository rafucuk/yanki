<template>
	<div
		v-if="!muted"
		v-show="!isDeleted"
		ref="el"
		v-hotkey="keymap"
		:class="$style.root"
	>
		<MkNoteSimple v-for="note in conversation" :key="note.id" :class="$style.replyToMore" :note="note"/>
		<MkNoteSimple v-if="appearNote.reply" :note="appearNote.reply" :class="$style.replyTo"/>
		<MkNoteSimple v-if="appearNote" :note="appearNote" :class="$style.replyTo"/>
		<MkNoteSimple v-for="note in replies" :key="note.id" :class="$style.reply" :note="note" :detail="true"/>

		<!-- <MkNoteSub v-for="note in replies" :key="note.id" :note="note" :class="$style.reply" :detail="true"/> -->
	</div>
	<div v-else class="_panel" :class="$style.muted" @click="muted = false">
		<I18n :src="i18n.ts.userSaysSomething" tag="small">
			<template #name>
				<MkA v-user-preview="appearNote.userId" :to="userPage(appearNote.user)">
					<MkUserName :user="appearNote.user"/>
				</MkA>
			</template>
		</I18n>
	</div>
	</template>
	
	<script lang="ts" setup>
	import { computed, inject, onMounted, ref, shallowRef } from 'vue';
	import * as mfm from 'mfm-js';
	import * as misskey from 'misskey-js';
	import MkNoteSub from '@/components/MkNoteSub.vue';
	import MkNoteSimple from '@/components/MkNoteSimple.vue';
	import MkReactionsViewer from '@/components/MkReactionsViewer.vue';
	import MkMediaList from '@/components/MkMediaList.vue';
	import MkCwButton from '@/components/MkCwButton.vue';
	import MkPoll from '@/components/MkPoll.vue';
	import MkUsersTooltip from '@/components/MkUsersTooltip.vue';
	import MkUrlPreview from '@/components/MkUrlPreview.vue';
	import MkInstanceTicker from '@/components/MkInstanceTicker.vue';
	import { pleaseLogin } from '@/scripts/please-login';
	import { checkWordMute } from '@/scripts/check-word-mute';
	import { userPage } from '@/filters/user';
	import { notePage } from '@/filters/note';
	import * as os from '@/os';
	import { defaultStore, noteViewInterruptors } from '@/store';
	import { reactionPicker } from '@/scripts/reaction-picker';
	import { extractUrlFromMfm } from '@/scripts/extract-url-from-mfm';
	import { $i } from '@/account';
	import { i18n } from '@/i18n';
	import { getNoteClipMenu, getNoteMenu } from '@/scripts/get-note-menu';
	import { useNoteCapture } from '@/scripts/use-note-capture';
	import { deepClone } from '@/scripts/clone';
	import { useTooltip } from '@/scripts/use-tooltip';
	import { claimAchievement } from '@/scripts/achievements';
	import { MenuItem } from '@/types/menu';
	import MkRippleEffect from '@/components/MkRippleEffect.vue';
	import { showMovedDialog } from '@/scripts/show-moved-dialog';
	
	const props = defineProps<{
		note: misskey.entities.Note;
		pinned?: boolean;
	}>();
	
	const inChannel = inject('inChannel', null);
	
	let note = $ref(deepClone(props.note));
	
	// plugin
	if (noteViewInterruptors.length > 0) {
		onMounted(async () => {
			let result = deepClone(note);
			for (const interruptor of noteViewInterruptors) {
				result = await interruptor.handler(result);
			}
			note = result;
		});
	}
	
	const isRenote = (
		note.renote != null &&
		note.text == null &&
		note.fileIds.length === 0 &&
		note.poll == null
	);
	
	const el = shallowRef<HTMLElement>();
	const menuButton = shallowRef<HTMLElement>();
	const renoteButton = shallowRef<HTMLElement>();
	const renoteTime = shallowRef<HTMLElement>();
	const reactButton = shallowRef<HTMLElement>();
	const clipButton = shallowRef<HTMLElement>();
	let appearNote = $computed(() => isRenote ? note.renote as misskey.entities.Note : note);
	const isMyRenote = $i && ($i.id === note.userId);
	const showContent = ref(false);
	const isDeleted = ref(false);
	const muted = ref(checkWordMute(appearNote, $i, defaultStore.state.mutedWords));
	const translation = ref(null);
	const translating = ref(false);
	const urls = appearNote.text ? extractUrlFromMfm(mfm.parse(appearNote.text)) : null;
	const showTicker = (defaultStore.state.instanceTicker === 'always') || (defaultStore.state.instanceTicker === 'remote' && appearNote.user.instance);
	const conversation = ref<misskey.entities.Note[]>([]);
	const replies = ref<misskey.entities.Note[]>([]);
	const canRenote = computed(() => ['public', 'home'].includes(appearNote.visibility) || appearNote.userId === $i.id);
	console.log(conversation);

	const keymap = {
		'r': () => reply(true),
		'e|a|plus': () => react(true),
		'q': () => renoteButton.value.renote(true),
		'esc': blur,
		'm|o': () => menu(true),
		's': () => showContent.value !== showContent.value,
	};
	
	useNoteCapture({
		rootEl: el,
		note: $$(appearNote),
		isDeletedRef: isDeleted,
	});
	
	useTooltip(renoteButton, async (showing) => {
		const renotes = await os.api('notes/renotes', {
			noteId: appearNote.id,
			limit: 11,
		});
	
		const users = renotes.map(x => x.user);
	
		if (users.length < 1) return;
	
		os.popup(MkUsersTooltip, {
			showing,
			users,
			count: appearNote.renoteCount,
			targetElement: renoteButton.value,
		}, {}, 'closed');
	});
	
	function renote(viaKeyboard = false) {
		pleaseLogin();
		showMovedDialog();
	
		let items = [] as MenuItem[];
	
		if (appearNote.channel) {
			items = items.concat([{
				text: i18n.ts.inChannelRenote,
				icon: 'ti ti-repeat',
				action: () => {
					const el = renoteButton.value as HTMLElement | null | undefined;
					if (el) {
						const rect = el.getBoundingClientRect();
						const x = rect.left + (el.offsetWidth / 2);
						const y = rect.top + (el.offsetHeight / 2);
						os.popup(MkRippleEffect, { x, y }, {}, 'end');
					}
	
					os.api('notes/create', {
						renoteId: appearNote.id,
						channelId: appearNote.channelId,
					}).then(() => {
						os.toast(i18n.ts.renoted);
					});
				},
			}, {
				text: i18n.ts.inChannelQuote,
				icon: 'ti ti-quote',
				action: () => {
					os.post({
						renote: appearNote,
						channel: appearNote.channel,
					});
				},
			}, null]);
		}
	
		items = items.concat([{
			text: i18n.ts.renote,
			icon: 'ti ti-repeat',
			action: () => {
				const el = renoteButton.value as HTMLElement | null | undefined;
				if (el) {
					const rect = el.getBoundingClientRect();
					const x = rect.left + (el.offsetWidth / 2);
					const y = rect.top + (el.offsetHeight / 2);
					os.popup(MkRippleEffect, { x, y }, {}, 'end');
				}
	
				os.api('notes/create', {
					renoteId: appearNote.id,
				}).then(() => {
					os.toast(i18n.ts.renoted);
				});
			},
		}, {
			text: i18n.ts.quote,
			icon: 'ti ti-quote',
			action: () => {
				os.post({
					renote: appearNote,
				});
			},
		}]);
	
		os.popupMenu(items, renoteButton.value, {
			viaKeyboard,
		});
	}
	
	function reply(viaKeyboard = false): void {
		pleaseLogin();
		showMovedDialog();
		os.post({
			reply: appearNote,
			animation: !viaKeyboard,
		}, () => {
			focus();
		});
	}
	
	function react(viaKeyboard = false): void {
		pleaseLogin();
		showMovedDialog();
		if (appearNote.reactionAcceptance === 'likeOnly') {
			os.api('notes/reactions/create', {
				noteId: appearNote.id,
				reaction: '❤️',
			});
			const el = reactButton.value as HTMLElement | null | undefined;
			if (el) {
				const rect = el.getBoundingClientRect();
				const x = rect.left + (el.offsetWidth / 2);
				const y = rect.top + (el.offsetHeight / 2);
				os.popup(MkRippleEffect, { x, y }, {}, 'end');
			}
		} else {
			blur();
			reactionPicker.show(reactButton.value, reaction => {
				os.api('notes/reactions/create', {
					noteId: appearNote.id,
					reaction: reaction,
				});
				if (appearNote.text && appearNote.text.length > 100 && (Date.now() - new Date(appearNote.createdAt).getTime() < 1000 * 3)) {
					claimAchievement('reactWithoutRead');
				}
			}, () => {
				focus();
			});
		}
	}
	
	function undoReact(note): void {
		const oldReaction = note.myReaction;
		if (!oldReaction) return;
		os.api('notes/reactions/delete', {
			noteId: note.id,
		});
	}
	
	function onContextmenu(ev: MouseEvent): void {
		const isLink = (el: HTMLElement) => {
			if (el.tagName === 'A') return true;
			if (el.parentElement) {
				return isLink(el.parentElement);
			}
		};
		if (isLink(ev.target)) return;
		if (window.getSelection().toString() !== '') return;
	
		if (defaultStore.state.useReactionPickerForContextMenu) {
			ev.preventDefault();
			react();
		} else {
			os.contextMenu(getNoteMenu({ note: note, translating, translation, menuButton, isDeleted }), ev).then(focus);
		}
	}
	
	function menu(viaKeyboard = false): void {
		os.popupMenu(getNoteMenu({ note: note, translating, translation, menuButton, isDeleted }), menuButton.value, {
			viaKeyboard,
		}).then(focus);
	}
	
	async function clip() {
		os.popupMenu(await getNoteClipMenu({ note: note, isDeleted }), clipButton.value).then(focus);
	}
	
	function showRenoteMenu(viaKeyboard = false): void {
		if (!isMyRenote) return;
		pleaseLogin();
		os.popupMenu([{
			text: i18n.ts.unrenote,
			icon: 'ti ti-trash',
			danger: true,
			action: () => {
				os.api('notes/delete', {
					noteId: note.id,
				});
				isDeleted.value = true;
			},
		}], renoteTime.value, {
			viaKeyboard: viaKeyboard,
		});
	}
	
	function focus() {
		el.value.focus();
	}
	
	function blur() {
		el.value.blur();
	}
	
	os.api('notes/children', {
		noteId: appearNote.id,
		limit: 30,
	}).then(res => {
		replies.value = res;
	});
	
	if (appearNote.replyId) {
		os.api('notes/conversation', {
			noteId: appearNote.replyId,
		}).then(res => {
			conversation.value = res.reverse();
		});
	}
	</script>
	
	<style lang="scss" module>
	.root {
		position: relative;
		transition: box-shadow 0.1s ease;
		overflow: clip;
		contain: content;
	}
	
	.replyTo {
		opacity: 0.7;
		padding-bottom: 0;
	}
	
	.replyToMore {
		opacity: 0.7;
	}
	
	.renote {
		display: flex;
		align-items: center;
		padding: 16px 32px 8px 32px;
		line-height: 28px;
		white-space: pre;
		color: var(--renote);
	}
	
	.renoteAvatar {
		flex-shrink: 0;
		display: inline-block;
		width: 28px;
		height: 28px;
		margin: 0 8px 0 0;
		border-radius: 6px;
	}
	
	.renoteText {
		overflow: hidden;
		flex-shrink: 1;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.renoteName {
		font-weight: bold;
	}
	
	.renoteInfo {
		margin-left: auto;
		font-size: 0.9em;
	}
	
	.renoteTime {
		flex-shrink: 0;
		color: inherit;
	}
	
	.renote + .note {
		padding-top: 8px;
	}
	
	.note {
		padding: 32px;
		font-size: 1.2em;
	
		&:hover > .main > .footer > .button {
			opacity: 1;
		}
	}
	
	.noteHeader {
		display: flex;
		position: relative;
		margin-bottom: 16px;
		align-items: center;
	}
	
	.noteHeaderAvatar {
		display: block;
		flex-shrink: 0;
		width: 58px;
		height: 58px;
	}
	
	.noteHeaderBody {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding-left: 16px;
		font-size: 0.95em;
	}
	
	.noteHeaderName {
		font-weight: bold;
		line-height: 1.3;
	}
	
	.isBot {
		display: inline-block;
		margin: 0 0.5em;
		padding: 4px 6px;
		font-size: 80%;
		line-height: 1;
		border: solid 0.5px var(--divider);
		border-radius: 4px;
	}
	
	.noteHeaderInfo {
		float: right;
	}
	
	.noteHeaderUsername {
		margin-bottom: 2px;
		line-height: 1.3;
		word-wrap: anywhere;
	}
	
	.noteContent {
		container-type: inline-size;
		overflow-wrap: break-word;
	}
	
	.cw {
		cursor: default;
		display: block;
		margin: 0;
		padding: 0;
		overflow-wrap: break-word;
	}
	
	.noteReplyTarget {
		color: var(--accent);
		margin-right: 0.5em;
	}
	
	.rn {
		margin-left: 4px;
		font-style: oblique;
		color: var(--renote);
	}
	
	.translation {
		border: solid 0.5px var(--divider);
		border-radius: var(--radius);
		padding: 12px;
		margin-top: 8px;
	}
	
	.poll {
		font-size: 80%;
	}
	
	.quote {
		padding: 8px 0;
	}
	
	.quoteNote {
		padding: 16px;
		border: dashed 1px var(--renote);
		border-radius: 8px;
	}
	
	.channel {
		opacity: 0.7;
		font-size: 80%;
	}
	
	.noteFooterInfo {
		margin: 16px 0;
		opacity: 0.7;
		font-size: 0.9em;
	}
	
	.noteFooterButton {
		margin: 0;
		padding: 8px;
		opacity: 0.7;
	
		&:not(:last-child) {
			margin-right: 28px;
		}
	
		&:hover {
			color: var(--fgHighlighted);
		}
	}
	
	.noteFooterButtonCount {
		display: inline;
		margin: 0 0 0 8px;
		opacity: 0.7;
	
		&.reacted {
			color: var(--accent);
		}
	}
	
	.reply {
		border-top: solid 0.5px var(--divider);
	}
	
	@container (max-width: 500px) {
		.root {
			font-size: 0.9em;
		}
	}
	
	@container (max-width: 450px) {
		.renote {
			padding: 8px 16px 0 16px;
		}
	
		.note {
			padding: 16px;
		}
	
		.noteHeaderAvatar {
			width: 50px;
			height: 50px;
		}
	}
	
	@container (max-width: 350px) {
		.noteFooterButton {
			&:not(:last-child) {
				margin-right: 18px;
			}
		}
	}
	
	@container (max-width: 300px) {
		.root {
			font-size: 0.825em;
		}
	
		.noteHeaderAvatar {
			width: 50px;
			height: 50px;
		}
	
		.noteFooterButton {
			&:not(:last-child) {
				margin-right: 12px;
			}
		}
	}
	
	.muted {
		padding: 8px;
		text-align: center;
		opacity: 0.7;
	}
	</style>
