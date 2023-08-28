<script lang="ts">
	import {
		Button,
		Column,
		DataTable,
		DataTableSkeleton,
		FluidForm,
		Grid,
		Modal,
		PaginationNav,
		Row,
		TextInput,
		Toolbar,
		ToolbarBatchActions,
		ToolbarContent
	} from 'carbon-components-svelte';
	import { addToastNotification, apiURL, user } from '../../store';
	import type { ToastNotificationData } from '../../store';
	import type { APIBook } from '../../apitype';
	import type { DataTableRow } from 'carbon-components-svelte/types/DataTable/DataTable.svelte';
	import { onMount } from 'svelte';
	import { Add, Edit, TrashCan } from 'carbon-icons-svelte';
	import { goto } from '$app/navigation';

	let headers = [
		{
			key: 'book_id',
			value: '帳簿番号'
		},
		{
			key: 'name',
			value: '名前'
		},
		{
			key: 'year',
			value: '年度'
		}
	];
	let rows: DataTableRow[] = [];
	let selectedRowIds: string[] = [];
	let pages: number = 1;
	let page: number = 1;
	let active = false;
	let open = false;
	let name = '';
	let year = '';
	let isListLoaded = false;
	$: invalidName = name.length < 3;
	$: invalidYear = !/^[0-9]+$/.test(year);

	onMount(() => {
		if ($user == null) {
			addToastNotification({
				type: 'error',
				title: 'ログインしてください',
				subtitle: 'ログインしてください',
				timeout: 3000,
				caption: new Date().toLocaleString()
			} as ToastNotificationData);
			goto('/');
			return;
		}

		getBooks();
	});

	function goBookDetail(row: CustomEvent<DataTableRow>) {
		goto(`/book/${row.detail.id}`);
	}

	async function getBooks() {
		const res = await fetch(`${apiURL}/book`, {
			method: 'GET',
			credentials: 'include'
		});

		if (res.status !== 200) {
			addToastNotification({
				type: 'error',
				title: '帳簿リスト読み込みに失敗しました',
				subtitle: '認証情報をお確かめください',
				timeout: 3000,
				caption: new Date().toLocaleString()
			} as ToastNotificationData);
			return;
		}

		type APIBookResponse = {
			books: APIBook[];
			message: string;
		};
		const data = (await res.json()) as APIBookResponse;
		let newRows: DataTableRow[] = [];
		data.books.forEach((book) => {
			newRows.push({
				id: book.book_id,
				book_id: book.book_id,
				name: book.name,
				year: book.year
			});
		});
		rows = newRows;
		if (rows.length % 20) {
			pages = Math.round(rows.length / 20) + 1;
		} else {
			pages = Math.round(rows.length / 20);
		}
		isListLoaded = true;
	}

	async function createBook() {
		const res = await fetch(`${apiURL}/book`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: name,
				year: year
			})
		});

		if (!res.ok) {
			addToastNotification({
				type: 'error',
				title: '帳簿作成に失敗しました',
				subtitle: '帳簿作成に失敗しました',
				timeout: 3000,
				caption: new Date().toLocaleString()
			} as ToastNotificationData);
			return;
		}

		addToastNotification({
			type: 'success',
			title: '帳簿作成に成功しました',
			subtitle: '帳簿作成に成功しました',
			timeout: 3000,
			caption: new Date().toLocaleString()
		} as ToastNotificationData);

		// Reset
		name = '';
		year = '';

		// Reload
		getBooks();
	}
</script>

<Grid>
	<Row>
		<Column>
			<h2>帳簿リスト</h2>
		</Column>
	</Row>
	<br />
	<Row>
		<Column>
			{#if !isListLoaded}
				<DataTableSkeleton {headers} rows={5} />
			{:else}
				<DataTable
					{headers}
					{rows}
					on:click:row={goBookDetail}
					selectable
					bind:selectedRowIds
				>
					<Toolbar>
						<ToolbarBatchActions bind:active on:cancel={() => (active = false)}>
							<Button icon={TrashCan} />
						</ToolbarBatchActions>
						<ToolbarContent>
							<Button icon={Edit} on:click={() => (active = true)} />
							<Button icon={Add} on:click={() => (open = true)} />
						</ToolbarContent>
					</Toolbar>
				</DataTable>
			{/if}
		</Column>
	</Row>

	<Row>
		<Column>
			<div class="pagination_nav">
				<PaginationNav total={pages} {page} />
			</div>
		</Column>
	</Row>
</Grid>

<Modal
	hasForm
	bind:open
	primaryButtonText="作成"
	secondaryButtonText="キャンセル"
	selectorPrimaryFocus="#email"
	modalHeading="帳簿作成"
	size="lg"
	on:click:button--secondary={() => (open = false)}
	primaryButtonDisabled={invalidName || invalidYear}
	on:open
	on:close
	on:submit={() => {
		createBook();
		open = false;
	}}
>
	<FluidForm>
		<TextInput
			required
			invalid={invalidName}
			invalidText="名前は3文字以上である必要があります"
			bind:value={name}
			id="name"
			labelText="Name"
			placeholder="Name"
			type="text"
		/>
		<TextInput
			required
			invalid={invalidYear}
			invalidText="年度は数字である必要があります"
			bind:value={year}
			labelText="Year"
			placeholder="year"
			type="number"
		/>
	</FluidForm>
</Modal>

<style>
	.pagination_nav {
		display: flex;
		justify-content: center;
	}
</style>
