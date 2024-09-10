<script lang="ts">
  import { slide } from 'svelte/transition';
</script>
<div out:slide class="settings-banner">
  <h3>No Periodic Notes Enabled</h3>

  <div class="setting-item">
    <div class="setting-item-info">
      <p class="setting-item-description">
        No periodic notes settings are enabled. You must turn on either the
        daily or weekly notes within the Periodic Notes plugin settings to be
        able to configure automatic tasks.
      </p>
    </div>
  </div>
</div>
