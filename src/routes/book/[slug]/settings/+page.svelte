<script lang="ts">
	import {
		Button,
		Column,
		DataTable,
		DataTableSkeleton,
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
	import { addToastNotification, apiURL, user } from '../../../../store';
	import type { PageData } from './$types';
	import type { ToastNotificationData } from '../../../../store';
	import type { APIBook, APIAccountTitle, APITransaction, APIBookAuthorization } from '../../../../apitype';
	import type { DataTableRow } from 'carbon-components-svelte/types/DataTable/DataTable.svelte';
	import { Add, ArrowLeft, Edit, SkipBack, TrashCan } from 'carbon-icons-svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const bookAuthorizationHeaders = [
		{ key: 'user_id', value: 'ユーザID' },
		{ key: 'authority', value: '権限' }
	];

	let pages: number = 1;
	let currentPage: number = 1;
	let active = false;
	let open = false;
	let isBookAuthorizationsLoaded = false;

	// Row Data
	export let data: PageData;
	let bookId = data.bookId;
	let book: APIBook | null = null;
	let bookAuthorizations: APIBookAuthorization[] = [];


	// Book Authorizations
	let bookAuthorizationsRows: DataTableRow[] = [];
	let selectedBookAuthorizationIds: string[] = [];

	// Add Book Authorization
	let addBookAuthorizationUserId = '';
	let addBookAuthorizationAuthority = '';

	onMount(() => {
		if ($user == null) {
			addToastNotification({
				type: 'error',
				title: 'ログインしてください',
				subtitle: 'ログインしてください',
				timeout: 3000,
				caption: new Date().toLocaleString()
			} as ToastNotificationData);
			return;
		}

		getBook();
		getBookAuthorizations();
	});

	async function addBookAuthorization() {
		const res = await fetch(`${apiURL}/book/${bookId}/bookAuthorization`, {
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				book_id: bookId,
				user_id: addBookAuthorizationUserId,
				authority: addBookAuthorizationAuthority
			})
		});

		if (!res.ok) {
			addToastNotification({
				type: 'error',
				title: '権限の追加に失敗しました',
				subtitle: '認証情報をお確かめください',
				timeout: 3000,
				caption: new Date().toLocaleString()
			} as ToastNotificationData);
			return;
		}

		addToastNotification({
			type: 'success',
			title: '権限の追加に成功しました',
			subtitle: '権限を追加しました',
			timeout: 3000,
			caption: new Date().toLocaleString()
		} as ToastNotificationData);

		// Reset
		addBookAuthorizationUserId = '';
		addBookAuthorizationAuthority = '';

		// Refresh
		await getBook();
		getBookAuthorizations();
	}

	async function getBookAuthorizations() {
		const res = await fetch(`${apiURL}/book/${bookId}/bookAuthorization`, {
			credentials: 'include'
		});

		if (!res.ok) {
			addToastNotification({
				type: 'error',
				title: '権限情報の取得に失敗しました',
				subtitle: '認証情報をお確かめください',
				timeout: 3000,
				caption: new Date().toLocaleString()
			} as ToastNotificationData);
			return;
		}

		type APIBookAuthorizationsResponse = {
			book_authorizations: APIBookAuthorization[];
			message: string;
		};
		const data = (await res.json()) as APIBookAuthorizationsResponse;
		bookAuthorizations = data.book_authorizations;
		isBookAuthorizationsLoaded = true;

		let newBookAuthorizationsRows = [] as DataTableRow[];
		bookAuthorizations.forEach((bookAuthorization) => {
			newBookAuthorizationsRows.push({
				id: uuidv4(),
				user_id: bookAuthorization.user_id,
				authority: bookAuthorization.authority
			});
		});
		bookAuthorizationsRows = newBookAuthorizationsRows;
	}

	async function deleteBookAuthorization() {
		selectedBookAuthorizationIds.forEach(async (id) => {
			const res = await fetch(`${apiURL}/book/${bookId}/bookAuthorization/${id}`, {
				method: 'DELETE',
				credentials: 'include'
			});

			if (!res.ok) {
				addToastNotification({
					type: 'error',
					title: '権限削除に失敗しました',
					subtitle: '権限削除に失敗しました',
					timeout: 3000,
					caption: new Date().toLocaleString()
				} as ToastNotificationData);
				return;
			}
		});

		addToastNotification({
			type: 'success',
			title: '権限削除に成功しました',
			subtitle: '権限削除に成功しました',
			timeout: 3000,
			caption: new Date().toLocaleString()
		} as ToastNotificationData);

		getBookAuthorizations();
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
			goto('/book');
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
</script>

<Grid noGutter>
	{#if book}
		<Row>
			<Column>
				<h2>
					<Button iconDescription="戻る" icon={ArrowLeft} kind="ghost" on:click={() => goto(`/book/${book?.book_id}`)}/> 
					{book.year}年度 {book.name}会計
				</h2>
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
		<Column><h3>権限リスト</h3></Column>
	</Row>
	<Row>
		<Column>
			{#if !isBookAuthorizationsLoaded}
				<DataTableSkeleton headers={bookAuthorizationHeaders} rows={5} />
			{:else}
				<DataTable
					selectable
					bind:selectedRowIds={selectedBookAuthorizationIds}
					nonSelectableRowIds={bookAuthorizationsRows
						.filter((row) => row.user_id === $user?.id)
						.map((row) => row.id)}
					headers={bookAuthorizationHeaders}
					rows={bookAuthorizationsRows}
				>
					<Toolbar size="default">
						<ToolbarBatchActions
							bind:active
							on:cancel={(e) => {
								e.preventDefault();
								active = false;
							}}
						>
							<Button
								icon={TrashCan}
								disabled={selectedBookAuthorizationIds.length === 0}
								on:click={() => {
									deleteBookAuthorization();
									selectedBookAuthorizationIds = [];
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
					on:change={() => getBookAuthorizations()}
				/>
			</div>
		</Column>
	</Row>
</Grid>

<Modal
	hasForm
	bind:open
	preventCloseOnClickOutside
	primaryButtonText="追加"
	secondaryButtonText="キャンセル"
	selectorPrimaryFocus="#date"
	modalHeading=" 権限追加"
	size="lg"
	primaryButtonDisabled={
		addBookAuthorizationUserId == '' || addBookAuthorizationAuthority == ''
	}
	on:click:button--secondary={() => (open = false)}
	on:open
	on:close
	on:submit={() => {
		open = false;
		addBookAuthorization();
	}}
>
	<Form on:submit>
		<FormGroup>
			<TextInput
				id="user_id"
				invalid={addBookAuthorizationUserId == ''}
				invalidText="ユーザーIDを入力してください"
				labelText="ユーザーID"
				placeholder="ユーザーID"
				type="text"
				bind:value={addBookAuthorizationUserId}
				required
			/>
			<TextInput
				id="authority"
				invalid={addBookAuthorizationAuthority == ''}
				invalidText="権限を入力してください"
				labelText="権限"
				placeholder="権限"
				type="text"
				bind:value={addBookAuthorizationAuthority}
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
