<script lang="ts">
	import {
		Column,
		DataTable,
		DataTableSkeleton,
		Grid,
		Loading,
		PaginationNav,
		Row
	} from 'carbon-components-svelte';
	import { accountTitleTypeString, addToastNotification, apiURL } from '../../../store';
	import type { PageData } from './$types';
	import type { ToastNotificationData } from '../../../store';
	import type { APIBook, APIAccountTitle } from '../../../apitype';
	import type { DataTableRow } from 'carbon-components-svelte/types/DataTable/DataTable.svelte';

	let balanceSheetHeaders = [
		{
			key: 'name',
			value: '勘定科目'
		},
		{
			key: 'amount',
			value: '残高'
		}
	];
	let profitAndLossHeaders = [
		{
			key: 'name',
			value: '勘定科目'
		},
		{
			key: 'amount',
			value: '残高'
		}
	];
	let balanceSheetRows: DataTableRow[] = [];
	let profitAndLossRows: DataTableRow[] = [];
	export let data: PageData;
	let bookId = data.bookId;
	let book: APIBook | null = null;

	async function getBook() {
		const res = await fetch(`${apiURL}/book/${bookId}`, {
			credentials: 'include'
		});

		if (!res.ok) {
			addToastNotification({
				type: 'error',
				title: '帳簿情報の取得に失敗しました',
				subtitle: '認証情報をお確かめください',
				timeout: 3000,
				caption: new Date().toLocaleString()
			} as ToastNotificationData);
			return;
		}

		type APIBookResponse = {
			book: APIBook;
			message: string;
		};
		const data = (await res.json()) as APIBookResponse;
		book = data.book;
	}
	getBook();

	async function getAccountTitles() {
		const res = await fetch(`${apiURL}/book/${bookId}/accountTitle`, {
			credentials: 'include'
		});

		if (res.status !== 200) {
			addToastNotification({
				type: 'error',
				title: '勘定科目リスト読み込みに失敗しました',
				subtitle: '認証情報をお確かめください',
				timeout: 3000,
				caption: new Date().toLocaleString()
			} as ToastNotificationData);
			return;
		}

		type APIAccountTitleResponse = {
			account_titles: APIAccountTitle[];
			message: string;
		};
		const data = (await res.json()) as APIAccountTitleResponse;
		let newBalanceSheetRows: DataTableRow[] = [];
		let newProfitAndLossRows: DataTableRow[] = [];
		data.account_titles.forEach((title) => {
			if (title.type < 2) {
				newBalanceSheetRows.push({
					id: title.title_id,
					title_id: title.title_id,
					name: title.name,
					type: accountTitleTypeString[title.type],
					amount: title.amount,
					amount_base: title.amount_base
				});
			} else {
				newProfitAndLossRows.push({
					id: title.title_id,
					title_id: title.title_id,
					name: title.name,
					type: accountTitleTypeString[title.type],
					amount: title.amount,
					amount_base: title.amount_base
				});
			}
		});
		newBalanceSheetRows = [
			...newBalanceSheetRows,
			{
				id: 'total',
				title_id: 'total',
				name: '合計',
				type: accountTitleTypeString[0],
				amount: newBalanceSheetRows.reduce((prev, current) => {
					if (current.type == accountTitleTypeString[0]) {
						return prev + current.amount;
					}
					return prev;
				}, 0),
				amount_base: 0
			} as DataTableRow,
			{
				id: 'total',
				title_id: 'total',
				name: '合計',
				type: accountTitleTypeString[1],
				amount: newBalanceSheetRows.reduce((prev, current) => {
					if (current.type == accountTitleTypeString[1]) {
						return prev + current.amount;
					}
					return prev;
				}, 0),
				amount_base: 0
			} as DataTableRow
		];

		newProfitAndLossRows = [
			...newProfitAndLossRows,
			{
				id: 'total',
				title_id: 'total',
				name: '合計',
				type: accountTitleTypeString[3],
				amount: newProfitAndLossRows.reduce((prev, current) => {
					if (current.type == accountTitleTypeString[3]) {
						return prev + current.amount;
					}
					return prev;
				}, 0),
				amount_base: 0
			} as DataTableRow,
			{
				id: 'total',
				title_id: 'total',
				name: '合計',
				type: accountTitleTypeString[2],
				amount: newProfitAndLossRows.reduce((prev, current) => {
					if (current.type == accountTitleTypeString[2]) {
						return prev + current.amount;
					}
					return prev;
				}, 0),
				amount_base: 0
			} as DataTableRow
		];

		balanceSheetRows = newBalanceSheetRows;
		profitAndLossRows = newProfitAndLossRows;
	}
	getAccountTitles();
</script>

<Grid noGutter>
	{#if book}
		<Row>
			<Column>
				<h2>{book.year}年度 {book.name}会計</h2>
			</Column>
		</Row>
	{:else}
		<Row>
			<Column>
				<Loading small />
			</Column>
		</Row>
	{/if}
	<br />
	<Row>
		<Column>
			<h2>貸借対照表</h2>
		</Column>
		<Column>
			<h2>損益計算書</h2>
		</Column>
	</Row>
	<br />
	<Row>
		<Column>
			<h3>資産の部</h3>
		</Column>
		<Column>
			<h3>負債の部</h3>
		</Column>
		<Column>
			<h3>利益の部</h3>
		</Column>
		<Column>
			<h3>損失の部</h3>
		</Column>
	</Row>
	<Row>
		<Column noGutterRight>
			{#if balanceSheetRows.length === 0}
				<DataTableSkeleton headers={balanceSheetHeaders} rows={5} />
			{:else}
				<DataTable
					headers={balanceSheetHeaders}
					rows={balanceSheetRows.filter(
						(title) => title.type == accountTitleTypeString[0]
					)}
				/>
			{/if}
		</Column>
		<Column noGutterLeft>
			{#if balanceSheetRows.length === 0}
				<DataTableSkeleton headers={balanceSheetHeaders} rows={5} />
			{:else}
				<DataTable
					headers={balanceSheetHeaders}
					rows={balanceSheetRows.filter(
						(title) => title.type == accountTitleTypeString[1]
					)}
				/>
			{/if}
		</Column>
		<Column noGutterRight>
			{#if profitAndLossHeaders.length === 0}
				<DataTableSkeleton headers={profitAndLossHeaders} rows={5} />
			{:else}
				<DataTable
					headers={profitAndLossHeaders}
					rows={profitAndLossRows.filter(
						(title) => title.type == accountTitleTypeString[3]
					)}
				/>
			{/if}
		</Column>
		<Column noGutterLeft>
			{#if profitAndLossHeaders.length === 0}
				<DataTableSkeleton headers={profitAndLossHeaders} rows={5} />
			{:else}
				<DataTable
					headers={profitAndLossHeaders}
					rows={profitAndLossRows.filter(
						(title) => title.type == accountTitleTypeString[2]
					)}
				/>
			{/if}
		</Column>
	</Row>
</Grid>
