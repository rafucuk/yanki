<template>
    <MkStickyContainer>
        <MkSpacer :contentMax="800">
            <MkNotes :pagination="directNotesPagination"/>
        </MkSpacer>
    </MkStickyContainer>
    </template>
    
    <script lang="ts" setup>
    import { computed } from 'vue';
    import MkNotes from '@/components/MkNotes.vue';
    import { i18n } from '@/i18n';
    import { definePageMetadata } from '@/scripts/page-metadata';
    
    const props = defineProps<{
        noteId: string;
    }>();
    
    const directNotesPagination = {
        reversed: true,
        endpoint: 'notes/thread' as const,
        limit: 5,
        params: {
            threadId: props.noteId,
        },
    };
    
    definePageMetadata(computed(() => ({
        title: i18n.ts.notifications,
        icon: 'ti ti-bell',
    })));
    </script>
    