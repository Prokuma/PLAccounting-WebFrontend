<script lang="ts">
  import { Theme } from "carbon-components-svelte";
  import type { CarbonTheme } from "carbon-components-svelte/types/Theme/Theme.svelte";
  import "carbon-components-svelte/css/all.css";

  let theme:CarbonTheme = "g90";
</script>

<Theme bind:theme />

<slot />