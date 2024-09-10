<script lang="ts">
  import { onDestroy } from 'svelte';
  import { writable, type Writable } from 'svelte/store';
  import type { IPeriodicity, ISettings } from '../index';
  import PeriodicNotesUnavailableBanner from '../components/PeriodicNotesUnavailableBanner.svelte';
  import PeriodicTaskSettings from '../components/PeriodicTaskSettings.svelte';
  import { capitalise } from '../../utils';

  export let settings: ISettings;
  export let onUpdateSettings: (newSettings: ISettings) => void;

  let settingsStore: Writable<ISettings> = writable(settings);

  const unsubscribeFromSettings = settingsStore.subscribe(onUpdateSettings);

  const periodicities: IPeriodicity[] = [
    'daily',
    'weekly',
  ];

  onDestroy(() => {
    unsubscribeFromSettings();
  });
</script>
{#if !$settingsStore.daily.available && !$settingsStore.weekly.available}
  <PeriodicNotesUnavailableBanner />
{/if}
{#each periodicities as periodicity}
  {#if $settingsStore[periodicity].available}
    <div class="setting-item setting-item-heading">
      <div class="setting-item-info">
        <div class="setting-item-name">
          <h3>
            {capitalise(periodicity)} Notes
          </h3>
        </div>
      </div>
    </div>
    <PeriodicTaskSettings settings={settingsStore} {periodicity} />
  {/if}
{/each}
