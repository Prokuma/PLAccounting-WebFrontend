<script lang="ts">
  import { 
    Theme, 
    Header, HeaderNav, HeaderNavItem, SkipToContent,
    Content, Grid, Row, Column, HeaderAction, HeaderPanelLinks, HeaderUtilities, HeaderPanelLink,
    SideNav, SideNavItems, SideNavLink, OverflowMenu, OverflowMenuItem, ToastNotification

  } from "carbon-components-svelte";
  import UserAvatarFilledAlt from "carbon-icons-svelte/lib/UserAvatarFilledAlt.svelte";
  import type { CarbonTheme } from "carbon-components-svelte/types/Theme/Theme.svelte";
  import "carbon-components-svelte/css/all.css";

  let theme:CarbonTheme = "g90";
  let isSideNavOpen = false;
  let isUserAvatarOpen = false;
  let isLogin = false;
</script>

<Theme bind:theme />

<Header 
  persistentHamburgerMenu={true}
  platformName="PLAccounting" 
  bind:isSideNavOpen
>
  <svelte:fragment slot="skip-to-content">
    <SkipToContent />
  </svelte:fragment>
  <HeaderUtilities>

      <OverflowMenu flipped icon={UserAvatarFilledAlt}>
        {#if isLogin}
        <OverflowMenuItem href="/">Logout</OverflowMenuItem>
        {:else}
        <OverflowMenuItem href="/">Login</OverflowMenuItem>
        <OverflowMenuItem href="/">Register</OverflowMenuItem>
        {/if}
      </OverflowMenu>
  </HeaderUtilities>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink href="/">Home</SideNavLink>
    <SideNavLink href="/book">Books</SideNavLink>
  </SideNavItems>
</SideNav>

<section>
  <ToastNotification style="margin: var(--cds-spacing-03) 0 0 auto;"
    lowContrast
    kind="error"
    title="Error"
    subtitle="Something went wrong"
    caption="Error code 1234567890"
  />
</section>

<Content>
  <slot />
</Content>

<style>
  section {
    position: fixed;
    width: 100%;
    flex-direction: column;
    padding-right: var(--cds-spacing-03);
    z-index: 1000;
  }
</style>