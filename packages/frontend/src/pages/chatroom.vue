<template>
    <MkStickyContainer>
        <MkSpacer :contentMax="800">
            <MkNotes ref="tlComponent" :noGap="!defaultStore.state.showGapBetweenNotesInTimeline" :pagination="directNotesPagination" @queue="emit('queue', $event)"/>
        </MkSpacer>
    </MkStickyContainer>
    </template>
    
    <script lang="ts" setup>
    import { computed } from 'vue';
    import MkNotes from '@/components/MkNotes.vue';
    import { i18n } from '@/i18n';
    import { definePageMetadata } from '@/scripts/page-metadata';
    import { useStream } from '@/stream';
    import * as sound from '@/scripts/sound';
    import { $i } from '@/account';
    import { defaultStore } from '@/store';

    let connection;

    const stream = useStream();


    const emit = defineEmits<{
        (ev: 'note'): void;
        (ev: 'queue', count: number): void;
    }>();

    const props = defineProps<{
        noteId: string;
        sound?: boolean;
    }>();

    const tlComponent: InstanceType<typeof MkNotes> = $ref();
    
    const prepend = note => {
        console.log('testt')
        tlComponent.pagingComponent?.prepend(note);

        emit('note');

        if (props.sound) {
            sound.play($i && (note.userId === $i.id) ? 'noteMy' : 'note');
        }
    };

	connection = stream.useChannel('globalTimeline');
	connection.on('note', prepend);
        
    const directNotesPagination = {
        reversed: true,
        endpoint: 'notes/thread' as const,
        limit: 10,
        params: {
            threadId: props.noteId,
        },
    };
    
    definePageMetadata(computed(() => ({
        title: i18n.ts.notifications,
        icon: 'ti ti-bell',
    })));
    </script>
    