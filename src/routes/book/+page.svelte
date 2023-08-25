<script lang="ts">
	import {
		Column,
		DataTable,
		DataTableSkeleton,
		Grid,
		PaginationNav,
		Row
	} from 'carbon-components-svelte';
	import { addToastNotification, apiURL } from '../../store';
	import type { ToastNotificationData } from '../../store';
	import type { APIBook } from '../../apitype';
	import type { DataTableRow } from 'carbon-components-svelte/types/DataTable/DataTable.svelte';

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
	let pages: number = 1;

	function goBookDetail(row: CustomEvent<DataTableRow>) {
		location.href = `/book/${row.detail.id}`;
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
	}
	getBooks();
</script>

<Grid noGutter>
	<Row>
		<Column>
			{#if rows.length === 0}
				<DataTableSkeleton {headers} rows={5} />
			{:else}
				<DataTable {headers} {rows} on:click:row={goBookDetail} />
			{/if}
		</Column>
	</Row>

	<Row>
		<Column>
			<div class="pagination_nav">
				<PaginationNav total={pages} />
			</div>
		</Column>
	</Row>
</Grid>

<style>
	.pagination_nav {
		display: flex;
		justify-content: center;
	}
</style>
