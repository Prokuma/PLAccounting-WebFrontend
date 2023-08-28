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
	import { addToastNotification, apiURL, user } from '../../../store';
	import type { PageData } from './$types';
	import type { ToastNotificationData } from '../../../store';
	import type { APIBook, APIAccountTitle, APITransaction } from '../../../apitype';
	import type { DataTableRow } from 'carbon-components-svelte/types/DataTable/DataTable.svelte';
	import { Add, Edit, TrashCan } from 'carbon-icons-svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const assetAndLiabilityHeaders = [
		{ key: 'asset', value: '資産' },
		{ key: 'asset_amount', value: '残高' },
		{ key: 'liability', value: '負債' },
		{ key: 'liability_amount', value: '残高' }
	];

	const profitAndLossHeaders = [
		{ key: 'loss', value: '費用' },
		{ key: 'loss_amount', value: '残高' },
		{ key: 'profit', value: '利益' },
		{ key: 'profit_amount', value: '残高' }
	];

	const transactionHeaders = [
		{ key: 'transaction_id', value: 'ID', width: '10%' },
		{ key: 'occured_at', value: '日付', width: '15%' },
		{ key: 'description_debit', value: '摘要', width: '25%' },
		{ key: 'description_credit', value: '', width: '25%' },
		{ key: 'debit', value: '借方', width: '10%' },
		{ key: 'credit', value: '貸方', width: '10%' }
	];
	let pages: number = 1;
	let currentPage: number = 1;
	let active = false;
	let open = false;
	let isTransactionLoaded = false;

	// Row Data
	export let data: PageData;
	let bookId = data.bookId;
	let book: APIBook | null = null;
	let accountTitles: APIAccountTitle[] = [];
	let transactions: APITransaction[] = [];

	// Balance Sheet
	let balanceSheetRows: DataTableRow[] = [];
	let profitAndLossRows: DataTableRow[] = [];

	// Transactions
	let transactionRows: DataTableRow[] = [];

	// Add Transaction Modal
	let selectedTransactionIds: string[] = [];
	let selectedDebitTitles: number[] = [0];
	let selectedCreditTitles: number[] = [0];
	let debitAmounts: number[] = [0];
	let creditAmounts: number[] = [0];
	let description: string = '';
	let date = new Date().toISOString().slice(0, 10);

	// Add Account Modal
	let selectedAddAccountTitleType = 0;
	let addAccountTitleName = '';
	let addAccountTitleAmountBase = 0;
	let openAccountTitle = false;

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

		getBook();
		getAccountTitles();
		getTransactions();
	});

	async function addTransaction() {
		if (
			debitAmounts.reduce((prev, current) => prev + current, 0) !=
			creditAmounts.reduce((prev, current) => prev + current, 0)
		) {
			addToastNotification({
				type: 'error',
				title: '借方と貸方の金額が一致しません',
				subtitle: '金額を確認してください',
				timeout: 3000,
				caption: new Date().toLocaleString()
			} as ToastNotificationData);
			return;
		}

		const res = await fetch(`${apiURL}/book/${bookId}/transaction`, {
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				book_id: bookId,
				description: description,
				occured_at: new Date(date).toISOString(),
				sub_transactions: [
					...debitAmounts.map((amount, index) => {
						return {
							account_title_id: selectedDebitTitles[index],
							is_debit: true,
							amount: amount
						};
					}),
					...creditAmounts.map((amount, index) => {
						return {
							account_title_id: selectedCreditTitles[index],
							is_debit: false,
							amount: amount
						};
					})
				]
			})
		});

		if (!res.ok) {
			addToastNotification({
				type: 'error',
				title: '仕訳の追加に失敗しました',
				subtitle: '認証情報をお確かめください',
				timeout: 3000,
				caption: new Date().toLocaleString()
			} as ToastNotificationData);
			return;
		}

		addToastNotification({
			type: 'success',
			title: '仕訳の追加に成功しました',
			subtitle: '仕訳を追加しました',
			timeout: 3000,
			caption: new Date().toLocaleString()
		} as ToastNotificationData);

		// Reset
		selectedDebitTitles = [0];
		selectedCreditTitles = [0];
		debitAmounts = [0];
		creditAmounts = [0];
		description = '';
		date = new Date().toISOString().slice(0, 10);

		// Refresh
		await getBook();
		await getAccountTitles();
		getTransactions();
	}

	async function deleteTransaction() {
		selectedTransactionIds.map(async (id) => {
			const res = await fetch(`${apiURL}/book/${bookId}/transaction/${id}`, {
				credentials: 'include',
				method: 'DELETE'
			});

			if (!res.ok) {
				addToastNotification({
					type: 'error',
					title: '仕訳の削除に失敗しました',
					subtitle: '認証情報をお確かめください',
					timeout: 3000,
					caption: new Date().toLocaleString()
				} as ToastNotificationData);
				return;
			}
		});

		addToastNotification({
			type: 'success',
			title: '仕訳の削除に成功しました',
			subtitle: '仕訳を削除しました',
			timeout: 3000,
			caption: new Date().toLocaleString()
		} as ToastNotificationData);

		// Refresh
		await getBook();
		await getAccountTitles();
		getTransactions();
	}

	async function addAccountTitle() {
		const res = await fetch(`${apiURL}/book/${bookId}/accountTitle`, {
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				book_id: bookId,
				name: addAccountTitleName,
				type: selectedAddAccountTitleType,
				amount_base: addAccountTitleAmountBase
			})
		});

		if (!res.ok) {
			addToastNotification({
				type: 'error',
				title: '勘定科目の追加に失敗しました',
				subtitle: '認証情報をお確かめください',
				timeout: 3000,
				caption: new Date().toLocaleString()
			} as ToastNotificationData);
			return;
		}

		addToastNotification({
			type: 'success',
			title: '勘定科目の追加に成功しました',
			subtitle: '勘定科目を追加しました',
			timeout: 3000,
			caption: new Date().toLocaleString()
		} as ToastNotificationData);

		// Reset
		selectedAddAccountTitleType = 0;
		addAccountTitleName = '';
		addAccountTitleAmountBase = 0;

		// Refresh
		await getBook();
		getAccountTitles();
	}

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
		let newAssetRows: DataTableRow[] = [
			{
				id: uuidv4(),
				title_id: 'current_assets',
				name: '流動資産',
				amount: '',
				amount_base: ''
			}
		];
		let newLiabilityRows: DataTableRow[] = [
			{
				id: uuidv4(),
				title_id: 'current_liabiliteis',
				name: '流動負債',
				amount: '',
				amount_base: ''
			}
		];

		let newLossRows: DataTableRow[] = [
			{
				id: uuidv4(),
				title_id: 'expenses',
				name: '営業費用',
				amount: '',
				amount_base: ''
			}
		];
		let newProfitRows: DataTableRow[] = [
			{
				id: uuidv4(),
				title_id: 'revenues',
				name: '営業利益',
				amount: '',
				amount_base: ''
			}
		];

		data.account_titles.forEach((title) => {
			if (title.type == 0) {
				newAssetRows.push({
					id: title.title_id,
					title_id: title.title_id,
					name: '　　' + title.name,
					amount: title.amount,
					amount_base: title.amount_base
				});
			} else if (title.type == 1) {
				newLiabilityRows.push({
					id: title.title_id,
					title_id: title.title_id,
					name: '　　' + title.name,
					amount: title.amount,
					amount_base: title.amount_base
				});
			} else if (title.type == 2) {
				newLossRows.push({
					id: title.title_id,
					title_id: title.title_id,
					name: '　　' + title.name,
					amount: title.amount,
					amount_base: title.amount_base
				});
			} else if (title.type == 3) {
				newProfitRows.push({
					id: title.title_id,
					title_id: title.title_id,
					name: '　　' + title.name,
					amount: title.amount,
					amount_base: title.amount_base
				});
			}
		});

		newAssetRows.push({
			id: uuidv4(),
			title_id: 'fixed_assets',
			name: '固定資産',
			amount: '',
			amount_base: ''
		});
		newLiabilityRows.push({
			id: uuidv4(),
			title_id: 'fixed_liabiliteis',
			name: '固定負債',
			amount: '',
			amount_base: ''
		});

		data.account_titles.forEach((title) => {
			if (title.type == 4) {
				newAssetRows.push({
					id: title.title_id,
					title_id: title.title_id,
					name: '　　' + title.name,
					type: title.type,
					amount: title.amount,
					amount_base: title.amount_base
				});
			} else if (title.type == 5) {
				newLiabilityRows.push({
					id: title.title_id,
					title_id: title.title_id,
					name: '　　' + title.name,
					type: title.type,
					amount: title.amount,
					amount_base: title.amount_base
				});
			}
		});

		newLiabilityRows.push({
			id: uuidv4(),
			title_id: 'capital',
			name: '資本',
			amount: '',
			amount_base: ''
		});

		data.account_titles.forEach((title) => {
			if (title.type == 7) {
				newLiabilityRows.push({
					id: title.title_id,
					title_id: title.title_id,
					name: '　　' + title.name,
					type: title.type,
					amount: title.amount,
					amount_base: title.amount_base
				});
			}
		});

		let numberOfAssets = newAssetRows.length;
		let numberOfLiabilities = newLiabilityRows.length;
		let diffBalanceSheet = numberOfAssets - numberOfLiabilities;
		if (diffBalanceSheet < 0) {
			for (let i = 0; i < Math.abs(diffBalanceSheet); i++) {
				newAssetRows.push({
					id: uuidv4(),
					title_id: 'blank',
					name: ' ',
					amount: '',
					amount_base: ''
				});
			}
		} else if (diffBalanceSheet > 0) {
			for (let i = 0; i < Math.abs(diffBalanceSheet); i++) {
				newLiabilityRows.push({
					id: uuidv4(),
					title_id: 'blank',
					name: ' ',
					amount: '',
					amount_base: ''
				});
			}
		}

		let numberOfProfit = newProfitRows.length;
		let numberOfLoss = newLossRows.length;
		let diffProfitAndLoss = numberOfProfit - numberOfLoss;
		if (diffProfitAndLoss < 0) {
			for (let i = 0; i < Math.abs(diffProfitAndLoss); i++) {
				newProfitRows.push({
					id: uuidv4(),
					title_id: 'blank',
					name: '',
					amount: '',
					amount_base: ''
				});
			}
		} else if (diffProfitAndLoss > 0) {
			for (let i = 0; i < Math.abs(diffProfitAndLoss); i++) {
				newLossRows.push({
					id: uuidv4(),
					title_id: 'blank',
					name: ' ',
					amount: '',
					amount_base: ''
				});
			}
		}

		let newBalanceSheetRows: DataTableRow[] = [];
		for (let i = 0; i < newAssetRows.length; i++) {
			newBalanceSheetRows.push({
				id: uuidv4(),
				asset: newAssetRows[i].name,
				asset_amount: newAssetRows[i].amount,
				liability: newLiabilityRows[i].name,
				liability_amount: newLiabilityRows[i].amount
			});
		}

		newBalanceSheetRows = [
			...newBalanceSheetRows,
			{
				id: 'total',
				title_id: 'total',
				asset: '資産合計',
				asset_amount: newAssetRows.reduce((prev, current) => {
					if (typeof current.amount != 'string') {
						return prev + current.amount;
					}
				}, 0),
				liability: '負債合計',
				liability_amount: newBalanceSheetRows.reduce((prev, current) => {
					if (typeof current.amount != 'string') {
						return prev + current.amount;
					}
					return prev;
				}, 0)
			} as DataTableRow
		];

		let newProfitAndLossRows: DataTableRow[] = [];
		for (let i = 0; i < newProfitRows.length; i++) {
			newProfitAndLossRows.push({
				id: uuidv4(),
				profit: newProfitRows[i].name,
				profit_amount: newProfitRows[i].amount,
				loss: newLossRows[i].name,
				loss_amount: newLossRows[i].amount
			});
		}
		newProfitAndLossRows = [
			...newProfitAndLossRows,
			{
				id: 'total',
				title_id: 'total',
				profit: '利益合計',
				profit_amount: newProfitRows.reduce((prev, current) => {
					if (typeof current.amount != 'string') {
						return prev + current.amount;
					}
					return prev;
				}, 0),
				loss: '費用合計',
				loss_amount: newLossRows.reduce((prev, current) => {
					if (typeof current.amount != 'string') {
						return prev + current.amount;
					}
					return prev;
				}, 0)
			} as DataTableRow
		];

		balanceSheetRows = newBalanceSheetRows;
		profitAndLossRows = newProfitAndLossRows;

		console.log(balanceSheetRows);
		console.log(profitAndLossRows);
	}

	async function getTransactions() {
		const res = await fetch(`${apiURL}/book/${bookId}/transaction/page/${currentPage - 1}`, {
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
		transactions = data.transactions;

		let newTransactionRows: DataTableRow[] = [];
		transactions.forEach((transaction) => {
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
				occured_at: transaction.occurred_at.slice(0, 10)
			});
			transaction.sub_transactions.forEach((subTransaction) => {
				newTransactionRows.push({
					id: `${transaction.transaction_id}:${subTransaction.sub_transaction_id}`,
					transaction_id: ' ',
					sub_transaction_id: subTransaction.sub_transaction_id,
					debit: subTransaction.is_debit ? subTransaction.amount : '',
					credit: subTransaction.is_debit ? '' : subTransaction.amount,
					amount: '',
					description_debit: subTransaction.is_debit
						? `(${subTransaction.account_title.name})`
						: '',
					description_credit: subTransaction.is_debit
						? ''
						: `(${subTransaction.account_title.name})`,
					occured_at: ''
				});
			});
		});
		transactionRows = newTransactionRows;
		isTransactionLoaded = true;
	}
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
		<Column>
			<h3>損益計算書</h3>
		</Column>
	</Row>
	<br />
	<Row>
		<Column>
			{#if balanceSheetRows.length === 0}
				<DataTableSkeleton size="short" headers={assetAndLiabilityHeaders} rows={5} />
			{:else}
				<DataTable size="short" headers={assetAndLiabilityHeaders} rows={balanceSheetRows}>
					<Toolbar size="sm">
						<ToolbarContent>
							<Button
								icon={Add}
								iconDescription="勘定科目追加"
								on:click={() => {
									openAccountTitle = true;
								}}
							/>
						</ToolbarContent>
					</Toolbar>
				</DataTable>
			{/if}
		</Column>
		<Column>
			{#if profitAndLossRows.length === 0}
				<DataTableSkeleton size="short" headers={profitAndLossHeaders} rows={5} />
			{:else}
				<DataTable size="short" headers={profitAndLossHeaders} rows={profitAndLossRows}>
					<Toolbar size="sm">
						<ToolbarContent>
							<Button
								icon={Add}
								iconDescription="勘定科目追加"
								on:click={() => {
									openAccountTitle = true;
								}}
							/>
						</ToolbarContent>
					</Toolbar>
				</DataTable>
			{/if}
		</Column>
	</Row>
	<br />
	<Row>
		<Column><h3>仕訳帳</h3></Column>
	</Row>
	<Row>
		<Column>
			{#if !isTransactionLoaded}
				<DataTableSkeleton size="compact" headers={transactionHeaders} rows={5} />
			{:else}
				<DataTable
					selectable
					bind:selectedRowIds={selectedTransactionIds}
					nonSelectableRowIds={transactionRows
						.filter((row) => row.sub_transaction_id)
						.map((row) => row.id)}
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
									deleteTransaction();
									selectedTransactionIds = [];
								}}
							/>
						</ToolbarBatchActions>
						<ToolbarContent>
							<Button
								icon={Edit}
								on:click={() => {
									active = true;
								}}
							/>
							<Button
								icon={Add}
								on:click={() => {
									open = true;
								}}
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
				<PaginationNav
					total={pages}
					shown={5}
					bind:page={currentPage}
					on:change={() => getTransactions()}
				/>
			</div>
		</Column>
	</Row>
</Grid>

<Modal
	hasForm
	bind:open
	primaryButtonText="追加"
	secondaryButtonText="キャンセル"
	selectorPrimaryFocus="#date"
	modalHeading="仕訳追加"
	size="lg"
	on:click:button--secondary={() => (open = false)}
	on:open
	on:close
	on:submit={() => {
		open = false;
		addTransaction();
	}}
>
	<Form on:submit>
		<FormGroup>
			<DatePicker datePickerType="single" dateFormat="Y/m/d" on:change>
				<DatePickerInput
					id="date"
					labelText="日付"
					placeholder="yyyy/mm/dd"
					type="date"
					bind:value={date}
					required
				/>
			</DatePicker>
			<br />
			<TextInput
				id="description"
				labelText="摘要"
				placeholder="摘要"
				type="text"
				bind:value={description}
				required
			/>

			<br />
			<Row>
				<Column>
					<Button
						kind="secondary"
						size="small"
						icon={Add}
						on:click={() => {
							selectedDebitTitles = [...selectedDebitTitles, 0];
						}}
					>
						借方追加
					</Button>
				</Column>
			</Row>
			{#each selectedDebitTitles as _, index}
				<Row>
					<Column>
						<Dropdown
							titleText="勘定科目"
							selectedId={selectedDebitTitles[index]}
							items={[
								...accountTitles
									.filter((title) =>
										title.type == 2 || title.type == 3
											? title.type % 2 == 0
											: true
									)
									.map((title) => {
										return {
											id: title.title_id,
											text: title.name
										};
									}),
								{ id: 0, text: '選択' }
							]}
							on:select={(e) => {
								selectedDebitTitles[index] = e.detail.selectedId;
								selectedDebitTitles = [...selectedDebitTitles];
							}}
						/>
					</Column>
					<Column>
						<TextInput
							id="amount"
							labelText="金額"
							placeholder="金額"
							type="number"
							bind:value={debitAmounts[index]}
							required
						/>
					</Column>
				</Row>
			{/each}

			<br />
			<Row>
				<Column>
					<Button
						kind="secondary"
						size="small"
						icon={Add}
						on:click={() => {
							selectedCreditTitles = [...selectedCreditTitles, 0];
						}}
					>
						貸方追加
					</Button>
				</Column>
			</Row>
			{#each selectedCreditTitles as _, index}
				<Row>
					<Column>
						<Dropdown
							titleText="勘定科目"
							selectedId={selectedCreditTitles[index]}
							items={[
								...accountTitles
									.filter((title) =>
										title.type == 2 || title.type == 3
											? title.type % 2 == 1
											: true
									)
									.map((title) => {
										return {
											id: title.title_id,
											text: title.name
										};
									}),
								{ id: 0, text: '選択' }
							]}
							on:select={(e) => {
								selectedCreditTitles[index] = e.detail.selectedId;
								selectedCreditTitles = [...selectedCreditTitles];
							}}
						/>
					</Column>
					<Column>
						<TextInput
							id="amount"
							labelText="金額"
							placeholder="金額"
							type="number"
							bind:value={creditAmounts[index]}
							required
						/>
					</Column>
				</Row>
			{/each}
		</FormGroup>
	</Form>
</Modal>

<Modal
	hasForm
	bind:open={openAccountTitle}
	primaryButtonText="追加"
	secondaryButtonText="キャンセル"
	selectorPrimaryFocus="#date"
	modalHeading="勘定科目追加"
	size="lg"
	on:click:button--secondary={() => (openAccountTitle = false)}
	on:open
	on:close
	on:submit={() => {
		openAccountTitle = false;
		addAccountTitle();
	}}
>
	<Form on:submit>
		<FormGroup>
			<TextInput
				id="name"
				labelText="名前"
				placeholder="名前"
				type="text"
				bind:value={addAccountTitleName}
				required
			/>
			<Dropdown
				titleText="区分"
				selectedId={selectedAddAccountTitleType}
				items={[
					{ id: 0, text: '流動資産' },
					{ id: 1, text: '流動負債' },
					{ id: 2, text: '営業費用' },
					{ id: 3, text: '営業利益' },
					{ id: 4, text: '固定資産' },
					{ id: 5, text: '固定負債' },
					{ id: 7, text: '資本' }
				]}
				on:select={(e) => {
					selectedAddAccountTitleType = e.detail.selectedId;
				}}
			/>
			<TextInput
				id="amount_base"
				labelText="元入金"
				placeholder="元入金"
				type="number"
				bind:value={addAccountTitleAmountBase}
				required
			/>
		</FormGroup>
	</Form>
</Modal>

<style>
	.pagination_nav {
		display: flex;
		justify-content: center;
	}
</style>
