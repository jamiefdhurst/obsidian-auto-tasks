<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { IPeriodicity, ISettings } from '..';
  import { capitalise } from '../../utils';

  export let settings: Writable<ISettings>;
  export let periodicity: IPeriodicity;
</script>
<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">Carry Over {capitalise(periodicity)} Tasks</div>
    <div class="setting-item-description">
      Whether any {periodicity} tasks that are incomplete should be automatically carried over to the following note.
    </div>
  </div>
  <div class="setting-item-control">
    <div
      class="checkbox-container"
      class:is-enabled={$settings[periodicity].carryOver}
      on:click={() => {
        $settings[periodicity].carryOver =
          !$settings[periodicity].carryOver;
      }}
    />
  </div>
</div>
<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">Set a Due Date</div>
    <div class="setting-item-description">
      Whether a due date for the current period should be automatically applied to any tasks that are created in the {periodicity} note.
    </div>
  </div>
  <div class="setting-item-control">
    <div
      class="checkbox-container"
      class:is-enabled={$settings[periodicity].setDueDate}
      on:click={() => {
        $settings[periodicity].setDueDate =
          !$settings[periodicity].setDueDate;
      }}
    />
  </div>
</div>
