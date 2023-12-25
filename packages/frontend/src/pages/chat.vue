<template>
    <MkStickyContainer>
       <MkNotes :pagination="directNotesPagination"/>
    </MkStickyContainer>
  </template>
  
  <script lang="ts" setup>
  import { computed } from 'vue';
  import MkNotes from '@/components/MkMessage.vue';
  import * as os from '@/os';
  import { i18n } from '@/i18n';
  import { definePageMetadata } from '@/scripts/page-metadata';
  import { notificationTypes } from '@/const';
  
  let tab = $ref('all');
  let includeTypes = $ref<string[] | null>(null);
  
  const directNotesPagination = {
      endpoint: 'notes/mentions' as const,
      limit: 10,
      params: {
          visibility: 'specified',
      },
  };
  
  function setFilter(ev) {
      const typeItems = notificationTypes.map(t => ({
          text: i18n.t(`_notification._types.${t}`),
          active: includeTypes && includeTypes.includes(t),
          action: () => {
              includeTypes = [t];
          },
      }));
      const items = includeTypes != null ? [{
          icon: 'ti ti-x',
          text: i18n.ts.clear,
          action: () => {
              includeTypes = null;
          },
      }, null, ...typeItems] : typeItems;
      os.popupMenu(items, ev.currentTarget ?? ev.target);
  }
  
  definePageMetadata(computed(() => ({
      title: i18n.ts.notifications,
      icon: 'ti ti-bell',
  })));
  </script>
  