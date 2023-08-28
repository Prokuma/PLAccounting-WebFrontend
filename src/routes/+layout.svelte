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
		HeaderNav,
		HeaderNavItem
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
	import { goto } from '$app/navigation';

	let theme: CarbonTheme = 'g90';
	let open = false;
	let openRegister = false;
	let email = '';
	let name = '';
	let password = '';
	$: invalidEmail =
		!/^[a-zA-Z0-9_+-]+(\.[a-zA-Z0-9_+-]+)*@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/.test(
			email
		);
	$: invalidName = name.length < 3;
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

		goto('/book');
	}

	async function register() {
		const res = await fetch(`${apiURL}/user`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email: email,
				name: name,
				password: password
			})
		});

		if (!res.ok) {
			addToastNotification({
				type: 'error',
				title: '登録に失敗しました',
				subtitle: `登録に失敗しました: ${res.formData().toString()}`,
				caption: new Date().toLocaleString(),
				timeout: 3000
			} as ToastNotificationData);
			return;
		}

		addToastNotification({
			type: 'success',
			title: '仮登録に成功しました',
			subtitle: '確認メールを送信しました',
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

		goto('/');
	}
</script>

<Theme bind:theme />

<Header persistentHamburgerMenu={false} platformName="PLAccounting">
	<svelte:fragment slot="skip-to-content">
		<SkipToContent />
	</svelte:fragment>
	<HeaderNav>
		<HeaderNavItem href="/">ホーム</HeaderNavItem>
		<HeaderNavItem href="/book">帳簿リスト</HeaderNavItem>
	</HeaderNav>
	<HeaderUtilities>
		<OverflowMenu flipped icon={UserAvatarFilledAlt}>
			{#if $user != null}
				<OverflowMenuItem on:click={() => logout()}>ログアウト</OverflowMenuItem>
			{:else}
				<OverflowMenuItem on:click={() => (open = true)}>ログイン</OverflowMenuItem>
				<OverflowMenuItem on:click={() => (openRegister = true)}>登録</OverflowMenuItem>
			{/if}
		</OverflowMenu>
	</HeaderUtilities>
</Header>

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
			labelText="メール"
			placeholder="example@example.com"
			type="email"
		/>
		<TextInput
			required
			bind:invalid={invalidPassword}
			invalidText="パスワードは6文字以上である必要があります"
			bind:value={password}
			labelText="パスワード"
			placeholder="Password1234!!!"
			type="password"
		/>
	</FluidForm>
</Modal>

<Modal
	hasForm
	bind:open={openRegister}
	primaryButtonText="登録"
	secondaryButtonText="キャンセル"
	selectorPrimaryFocus="#regist_email"
	modalHeading="登録"
	size="lg"
	on:click:button--secondary={() => (openRegister = false)}
	primaryButtonDisabled={invalidEmail || invalidPassword}
	on:open
	on:close
	on:submit={() => {
		register();
		openRegister = false;
	}}
>
	<FluidForm>
		<TextInput
			required
			bind:invalid={invalidEmail}
			invalidText="メールアドレスの形式が正しくありません"
			bind:value={email}
			id="regist_email"
			labelText="メールアドレス"
			placeholder="example@example.com"
			type="email"
		/>
		<TextInput
			required
			bind:invalid={invalidName}
			invalidText="名前は3文字以上である必要があります"
			bind:value={name}
			labelText="氏名"
			placeholder="田中太郎"
			type="text"
		/>
		<TextInput
			required
			bind:invalid={invalidPassword}
			invalidText="パスワードは6文字以上である必要があります"
			bind:value={password}
			labelText="パスワード"
			placeholder="Password1234!!!"
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
