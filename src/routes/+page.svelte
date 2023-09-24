<script>
	import { goto } from '$app/navigation';
	import { Grid, Row, Column, Tab, Button } from 'carbon-components-svelte';
	import { onMount } from 'svelte';
	import { user } from '../store';

	onMount(() => {
		if ($user != null) {
			//goto('/book');
		}
	});
</script>

<Grid>
	<Row>
		<Column>
			{#if $user != null}
				<h1>ようこそ、{$user.name}さん</h1>
				<br/>
				<h3>ユーザ情報</h3>
				<br/>
				<p><strong>ユーザID</strong>: {$user.id}</p>
				<p><strong>ユーザ名</strong>: {$user.name}</p>
				<p><strong>メールアドレス</strong>: {$user.email}</p>
				<br/>
				<Button on:click={() => goto('/book')}>帳簿一覧</Button>
			{:else}
				<h1>PLAccounting - Free Accounting Software</h1>
				<h3>無料で使用できる自己ホスティング型簡易電子帳簿</h3>
			{/if}
		</Column>
	</Row>
</Grid>