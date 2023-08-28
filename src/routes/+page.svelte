<script>
	import { goto } from '$app/navigation';
	import { Grid, Row, Column } from 'carbon-components-svelte';
	import { onMount } from 'svelte';
	import { user } from '../store';

	onMount(() => {
		if ($user != null) {
			goto('/book');
		}
	});
</script>

<Grid>
	<Row>
		<Column>
			<h1>PLAccounting</h1>
			<p>PLAccountingメインページ</p>
		</Column>
	</Row>
</Grid>
