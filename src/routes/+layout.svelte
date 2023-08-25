<script lang="ts">
	import {
		Theme,
		Header,
		SkipToContent,
		Content,
		HeaderUtilities,
		SideNav,
		SideNavItems,
		SideNavLink,
		OverflowMenu,
		OverflowMenuItem,
		ToastNotification,
		Modal,
		FluidForm,
		TextInput,
		PasswordInput,
		ComposedModal,
		ModalHeader,
		ModalBody,
		ModalFooter,
		Form
	} from 'carbon-components-svelte';
	import UserAvatarFilledAlt from 'carbon-icons-svelte/lib/UserAvatarFilledAlt.svelte';
	import type { CarbonTheme } from 'carbon-components-svelte/types/Theme/Theme.svelte';
	import 'carbon-components-svelte/css/all.css';
	import {
		addToastNotification,
		apiURL,
		toastNotifications,
		user,
		type ToastNotificationData
	} from '../store';
	import { DataCategorical, Label } from 'carbon-icons-svelte';

	let theme: CarbonTheme = 'g90';
	let isSideNavOpen = false;
	let open = false;
	let email = '';
	let password = '';
	$: invalidEmail = !/^[a-zA-Zd\.\_\-]+@[a-zA-Zd\.\_\-]+\.[a-zA-Zd\.\_\-]+$/.test(email);
	$: invalidPassword = password.length < 6;

	async function login() {
		const res = await fetch(`${apiURL}/login`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email: email,
				password: password
			})
		});

		if (res.status !== 200) {
			addToastNotification({
				type: 'error',
				title: 'ログインに失敗しました',
				subtitle: 'メールアドレスまたはパスワードが間違っています',
				caption: new Date().toLocaleString(),
				timeout: 3000
			} as ToastNotificationData);
			return;
		}
		const data = await res.json();
		user.set(data);
		addToastNotification({
			type: 'success',
			title: 'ログインに成功しました',
			subtitle: 'ようこそ',
			caption: new Date().toLocaleString(),
			timeout: 3000
		} as ToastNotificationData);
	}

	async function logout() {
		const res = await fetch(`${apiURL}/logout`, {
			credentials: 'include'
		});

		if (res.status != 200) {
			addToastNotification({
				type: 'error',
				title: 'ログアウトに失敗しました',
				subtitle: 'ログアウトに失敗しました',
				caption: new Date().toLocaleString(),
				timeout: 3000
			} as ToastNotificationData);
		}
		user.set(null);
		addToastNotification({
			type: 'success',
			title: 'ログアウトに成功しました',
			subtitle: 'ログアウトに成功しました',
			caption: new Date().toLocaleString(),
			timeout: 3000
		} as ToastNotificationData);
	}
</script>

<Theme bind:theme />

<Header persistentHamburgerMenu={true} platformName="PLAccounting" bind:isSideNavOpen>
	<svelte:fragment slot="skip-to-content">
		<SkipToContent />
	</svelte:fragment>
	<HeaderUtilities>
		<OverflowMenu flipped icon={UserAvatarFilledAlt}>
			{#if $user != null}
				<OverflowMenuItem on:click={() => logout()}>Logout</OverflowMenuItem>
			{:else}
				<OverflowMenuItem on:click={() => (open = true)}>Login</OverflowMenuItem>
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

<Modal
	hasForm
	bind:open
	primaryButtonText="ログイン"
	secondaryButtonText="キャンセル"
	selectorPrimaryFocus="#email"
	modalHeading="ログイン"
	size="lg"
	on:click:button--secondary={() => (open = false)}
	primaryButtonDisabled={invalidEmail || invalidPassword}
	on:open
	on:close
	on:submit={() => {
		login();
		open = false;
	}}
>
	<FluidForm>
		<TextInput
			required
			bind:invalid={invalidEmail}
			invalidText="メールアドレスの形式が正しくありません"
			bind:value={email}
			id="email"
			labelText="Email"
			placeholder="Email"
			type="email"
		/>
		<TextInput
			required
			bind:invalid={invalidPassword}
			invalidText="パスワードは6文字以上である必要があります"
			bind:value={password}
			labelText="Password"
			placeholder="Password"
			type="password"
		/>
	</FluidForm>
</Modal>

<section>
	{#if $toastNotifications}
		{#each $toastNotifications as toastNotification (toastNotification.id)}
			<ToastNotification
				style="margin: var(--cds-spacing-03) 0 0 auto;"
				lowContrast
				kind={toastNotification.type}
				title={toastNotification.title}
				subtitle={toastNotification.subtitle}
				caption={toastNotification.caption}
			/>
		{/each}
	{/if}
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
