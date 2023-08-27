<script lang="ts">
	import {
		Button,
		Column,
		DataTable,
		DataTableSkeleton,
		DatePicker,
		DatePickerInput,
		Dropdown,
		Form,
		FormGroup,
		Grid,
		Loading,
		Modal,
		PaginationNav,
		Row,
		TextInput,
		Toolbar,
		ToolbarBatchActions,
		ToolbarContent
	} from 'carbon-components-svelte';
	import { v4 as uuidv4 } from 'uuid';
	import { addToastNotification, apiURL } from '../../../store';
	import type { PageData } from './$types';
	import type { ToastNotificationData } from '../../../store';
	import type { APIBook, APIAccountTitle, APITransaction } from '../../../apitype';
	import type { DataTableRow } from 'carbon-components-svelte/types/DataTable/DataTable.svelte';
	import { Add, Edit, TrashCan } from 'carbon-icons-svelte';

	const assetHeaders = [
		{ key: 'name', value: '資産' },
		{ key: 'amount', value: '残高' }
	];
	const liabilityHeaders = [
		{ key: 'name', value: '負債' },
		{ key: 'amount', value: '残高' }
	];

	const profitHeaders = [
		{ key: 'name', value: '利益' },
		{ key: 'amount', value: '残高' }
	];
	const lossHeaders = [
		{ key: 'name', value: '費用' },
		{ key: 'amount', value: '残高' }
	];
	const transactionHeaders = [
		{ key: 'transaction_id', value: 'ID', width: "10%"},
		{ key: 'occured_at', value: '日付',  width: "15%"},
		{ key: 'description_debit', value: '摘要', width: "25%" },
		{ key: 'description_credit', value: '', width: "25%" },
		{ key: 'debit', value: '借方', width: "10%" },
		{ key: 'credit', value: '貸方', width: "10%" }
	];
	let balanceSheetRows: DataTableRow[] = [];
	let profitAndLossRows: DataTableRow[] = [];
	let transactionRows: DataTableRow[] = [];
	let pages: number = 1;
	let currentPage: number = 1;
	export let data: PageData;
	let bookId = data.bookId;
	let book: APIBook | null = null;
	let active = false;
	let open = false;
	let selectedTransactionIds: string[] = [];
	let accountTitles: APIAccountTitle[] = [];
	let selectedType: number = 0;
	let selectedAccountTtile: number = 0;

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
			pages: number;
			message: string;
		};
		const data = (await res.json()) as APIBookResponse;
		book = data.book;
		pages = data.pages;
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
		accountTitles = data.account_titles;
		let newBalanceSheetRows: DataTableRow[] = [
			{ id: uuidv4(), title_id: 'current_assets', name: '流動資産',
			  type: 0, amount: '', amount_base: '' },
			{ id: uuidv4(), title_id: 'current_liabiliteis', name: '流動負債',
		      type: 1, amount: '', amount_base: '' }
		];
		let newProfitAndLossRows: DataTableRow[] = [
			{ id: uuidv4(), title_id: 'expenses', name: '営業費用',
			  type: 2,amount: '', amount_base: '' },
			{ id: uuidv4(), title_id: 'revenues', name: '営業利益',
			  type: 3, amount: '', amount_base: '' }
		];
		data.account_titles.forEach((title) => {
			if (title.type < 2) {
				newBalanceSheetRows.push({
					id: title.title_id,
					title_id: title.title_id,
					name: "　　" + title.name,
					type: title.type,
					amount: title.amount,
					amount_base: title.amount_base
				});
			} else if (title.type < 4) {
				newProfitAndLossRows.push({
					id: title.title_id,
					title_id: title.title_id,
					name: "　　" + title.name,
					type: title.type,
					amount: title.amount,
					amount_base: title.amount_base
				});
			}
		});

		newBalanceSheetRows.push(
			{ id: uuidv4(), title_id: 'fixed_assets', name: '固定資産',
			  type: 4, amount: '', amount_base: '' });
		newBalanceSheetRows.push(
			{ id: uuidv4(), title_id: 'fixed_liabiliteis', name: '固定負債',
			  type: 5, amount: '', amount_base: ''});

		data.account_titles.forEach((title) => {
			if (title.type >= 4 && title.type < 6) {
				newBalanceSheetRows.push({
					id: title.title_id,
					title_id: title.title_id,
					name: "　　" + title.name,
					type: title.type,
					amount: title.amount,
					amount_base: title.amount_base
				});
			}
		});

		newBalanceSheetRows.push(
			{ id: uuidv4(), title_id: 'capital', name: '資本',
			  type: 7, amount: '', amount_base: '' });

		data.account_titles.forEach((title) => {
			if (title.type == 7) {
				newBalanceSheetRows.push({
					id: title.title_id,
					title_id: title.title_id,
					name: "　　" + title.name,
					type: title.type,
					amount: title.amount,
					amount_base: title.amount_base
				});
			}
		});

		let numberOfAssets = newBalanceSheetRows.reduce((prev, current) => {
			if (current.type % 2 == 0) { return prev + 1; }
			return prev;
		}, 0);

		let numberOfLiabilities = newBalanceSheetRows.reduce((prev, current) => {
			if (current.type % 2) { return prev + 1; }
			return prev;
		}, 0);

		let diffBalanceSheet = numberOfAssets - numberOfLiabilities
		if (diffBalanceSheet < 0) {
			for (let i = 0; i < Math.abs(diffBalanceSheet); i++) {
				newBalanceSheetRows.push(
					{ id: uuidv4(), title_id: 'blank', name: ' ',
					  type: 0, amount: '', amount_base: '' });
			}
		} else if (diffBalanceSheet > 0) {
			for (let i = 0; i < Math.abs(diffBalanceSheet); i++) {
				newBalanceSheetRows.push(
					{ id: uuidv4(), title_id: 'blank', name: ' ',
					  type: 1, amount: '', amount_base: '' });
			}
		}

		let numberOfProfit = newProfitAndLossRows.reduce((prev, current) => {
			if (current.type == 3) { return prev + 1; }
			return prev;
		}, 0);

		let numberOfLoss = newProfitAndLossRows.reduce((prev, current) => {
			if (current.type == 2) {
				return prev + 1;
			}
			return prev;
		}, 0);

		let diffProfitAndLoss = numberOfProfit - numberOfLoss;
		if (diffProfitAndLoss < 0) {
			for (let i = 0; i < Math.abs(diffProfitAndLoss); i++) {
				newProfitAndLossRows.push(
					{ id: uuidv4(), title_id: 'blank', name: ' ',
					  type: 3, amount: '', amount_base: '' });
			}
		} else if (diffProfitAndLoss > 0) {
			for (let i = 0; i < Math.abs(diffProfitAndLoss); i++) {
				newProfitAndLossRows.push(
					{ id: uuidv4(), title_id: 'blank', name: ' ',
					  type: 2, amount: '', amount_base: '' });
			}
		}

		newBalanceSheetRows = [
			...newBalanceSheetRows,
			{
				id: 'total', title_id: 'total', name: '資産合計', type: 0,
				amount: newBalanceSheetRows.reduce((prev, current) => {
					if (typeof(current.amount) != 'string' && current.type == 0) {
						return prev + current.amount;
					}
					return prev;
				}, 0),
				amount_base: 0
			} as DataTableRow,
			{
				id: 'total', title_id: 'total', name: '負債合計', type: 1,
				amount: newBalanceSheetRows.reduce((prev, current) => {
					if (typeof(current.amount) != 'string' && current.type == 1) {
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
				id: 'total', title_id: 'total', name: '利益合計', type: 3,
				amount: newProfitAndLossRows.reduce((prev, current) => {
					if (typeof(current.amount) != "string" && current.type == 3) {
						return prev + current.amount;
					}
					return prev;
				}, 0),
				amount_base: 0
			} as DataTableRow,
			{
				id: 'total', title_id: 'total', name: '費用合計', type: 2,
				amount: newProfitAndLossRows.reduce((prev, current) => {
					if (typeof(current.amount) != 'string' && current.type == 2) {
						return prev + current.amount;
					}
					return prev;
				}, 0),
				amount_base: 0
			} as DataTableRow
		];

		balanceSheetRows = newBalanceSheetRows;
		profitAndLossRows = newProfitAndLossRows;

		console.log(balanceSheetRows);
		console.log(profitAndLossRows);
	}
	getAccountTitles();

	async function getTransactions() {
		const res = await fetch(`${apiURL}/book/${bookId}/transaction/page/${pages-1}`, {
			credentials: 'include'
		});

		if (!res.ok) {
			addToastNotification({
				type: 'error',
				title: '仕訳帳の取得に失敗しました',
				subtitle: '認証情報をお確かめください',
				timeout: 3000,
				caption: new Date().toLocaleString()
			} as ToastNotificationData);
			return;
		}

		type APITransactionResponse = {
			transactions: APITransaction[];
			message: string;
		};

		const data = (await res.json()) as APITransactionResponse;
		let newTransactionRows: DataTableRow[] = [];

		data.transactions.forEach((transaction) => {
			newTransactionRows.push({
				id: `${transaction.transaction_id}`,
				transaction_id: transaction.transaction_id,
				description_credit: ' ',
				description_debit: transaction.description,
				credit: transaction.sub_transactions.reduce((prev, current) => {
					if (!current.is_debit) {
						return prev + current.amount;
					}
					return prev;
				}, 0),
				debit: transaction.sub_transactions.reduce((prev, current) => {
					if (current.is_debit) {
						return prev + current.amount;
					}
					return prev;
				}, 0),
				occured_at: transaction.occurred_at.slice(0, 10),
			})
			transaction.sub_transactions.forEach((subTransaction) => {
					newTransactionRows.push({
						id: `${transaction.transaction_id}:${subTransaction.sub_transaction_id}`,
						transaction_id: ' ',
						sub_transaction_id: subTransaction.sub_transaction_id,
						debit: (subTransaction.is_debit) ? subTransaction.amount : '',
						credit: (subTransaction.is_debit) ? '' : subTransaction.amount,
						amount: '',
						description_debit: (subTransaction.is_debit) ? `(${subTransaction.account_title.name})` : '',
						description_credit: (subTransaction.is_debit) ? '' : `(${subTransaction.account_title.name})`,
						occured_at: '',
					});
			})
		});
		transactionRows = newTransactionRows;
	}
	getTransactions();
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
			<h3>貸借対照表</h3>
		</Column>
		<Column/>
		<Column>
			<h3>損益計算書</h3>
		</Column>
		<Column/>
	</Row>
	<br />
	<Row>
		<Column noGutterRight>
			{#if balanceSheetRows.length === 0}
				<DataTableSkeleton size="short" headers={assetHeaders} rows={5} />
			{:else}
				<DataTable
					size="short"
					headers={assetHeaders}
					rows={balanceSheetRows.filter(
						(title) => title.type % 2 == 0
					)}
				/>
			{/if}
		</Column>
		<Column noGutterLeft>
			{#if balanceSheetRows.length === 0}
				<DataTableSkeleton size="short" headers={liabilityHeaders} rows={5} />
			{:else}
				<DataTable
					size="short"
					headers={liabilityHeaders}
					rows={balanceSheetRows.filter(
						(title) => title.type % 2
					)}
				/>
			{/if}
		</Column>
		<Column noGutterRight>
			{#if profitAndLossRows.length === 0}
				<DataTableSkeleton size="short" headers={lossHeaders} rows={5} />
			{:else}
				<DataTable
					size="short"
					headers={lossHeaders}
					rows={profitAndLossRows.filter(
						(title) => title.type == 2
					)}
				/>
			{/if}
		</Column>
		<Column noGutterLeft>
			{#if profitAndLossRows.length === 0}
				<DataTableSkeleton size="short" headers={profitHeaders} rows={5} />
			{:else}
				<DataTable
					size="short"
					headers={profitHeaders}
					rows={profitAndLossRows.filter(
						(title) => title.type == 3
					)}
				/>
			{/if}
		</Column>
	</Row>
	<br />
	<Row>
		<Column><h3>仕訳帳</h3></Column>
	</Row>
	<Row>
		<Column>
			{#if transactionRows.length === 0}
				<DataTableSkeleton size="compact" headers={transactionHeaders} rows={5} />
			{:else}
				<DataTable
					selectable
					bind:selectedRowIds={selectedTransactionIds}
					nonSelectableRowIds={transactionRows.filter((row) => row.sub_transaction_id).map((row) => row.id)}
					size="compact"
					headers={transactionHeaders}
					rows={transactionRows}
				>
					<Toolbar size="sm">
						<ToolbarBatchActions
							bind:active
							on:cancel={(e) => {
								e.preventDefault();
								active = false;
							}}
						>
							<Button
								icon={TrashCan}
								disabled={selectedTransactionIds.length === 0}
								on:click={() => {
									// TODO: delete transactions
									transactionRows = transactionRows.filter((row) => !row.id.indexOf(row.id));
									selectedTransactionIds = [];
								}}
							/>
						</ToolbarBatchActions>
						<ToolbarContent>
							<Button
								icon={Edit}
								on:click={() => {active = true}}
							/>
							<Button
								icon={Add}
								on:click={() => {open = true}}
							/>
						</ToolbarContent>
					</Toolbar>
				</DataTable>
			{/if}
		</Column>
	</Row>
	<Row>
		<Column>
			<div class="pagination_nav">
				<PaginationNav total={pages} shown={5} bind:page={currentPage} on:change={() => getTransactions()} />
			</div>
		</Column>
	</Row>
</Grid>

<Modal
	hasForm
	bind:open
	primaryButtonText="仕訳追加"
	secondaryButtonText="キャンセル"
	selectorPrimaryFocus="#date"
	modalHeading="仕訳追加"
	size="lg"
	on:click:button--secondary={() => (open = false)}
	on:open
	on:close
	on:submit={() => {
		open = false;
		getTransactions();
	}}
>
	<Form on:submit>
		<FormGroup>
			<DatePicker
				datePickerType="single"
				dateFormat="Y/m/d"
				on:change
			>
				<DatePickerInput
					id="date"
					labelText="日付"
					placeholder="yyyy/mm/dd"
					type="date"
					required
				/>
			</DatePicker>
			<TextInput
				id="description"
				labelText="摘要"
				placeholder="摘要"
				type="text"
				required
			/>
			<Row>
				<!-- TODO: Implement Add sub transactions -->
				<Column>
					<Dropdown
						titleText="種別"
						selectedId={selectedType}
						items={[
							{ id: 0, text: '借方' },
							{ id: 1, text: '貸方' }
						]}
					/>
				</Column>
				<Column>
					<Dropdown
						titleText="勘定科目"
						selectedId={selectedAccountTtile}
						items={[...accountTitles.filter((title) => (title.type == 2 || title.type == 3) ? title.type % 2 != selectedType : true).map((title, index) => {
							return {
								id: title.title_id,
								text: title.name
							};
						}), {id: 0, text: "選択"}]}
					/>
				</Column>
				<Column>
					<TextInput
						id="amount"
						labelText="金額"
						placeholder="金額"
						type="number"
						required
					/>
				</Column>
			</Row>
		</FormGroup>
	</Form>
</Modal>

<style>
	.pagination_nav {
		display: flex;
		justify-content: center;
	}
</style>