<script lang="ts">
	import { Column, DataTable, Grid, PaginationNav, Row } from "carbon-components-svelte";

</script>

<Grid fullWidth noGutter>
<Row>
    <Column>
    <DataTable
        headers={[
            {
                key: "bid",
                value: "BookID",
            },
            {
                key: "name",
                value: "Name",
            },
            {
                key: "year",
                value: "Year",
            },
        ]}
        rows={[
            {
                id: "a",
                bid: "Load Balancer 3",
                name: "HTTP",
                year: 3000,
            },
            {
                id: "b",
                bid: "Load Balancer 1",
                name: "HTTP",
                year: 3000,
            },
            {
                id: "c",
                bid: "Load Balancer 2",
                name: "HTTP",
                year: 3000,
            },
        ]}
    />
    </Column>
</Row>

<Row>
    <Column>
        <div class="pagination_nav">
            <PaginationNav total={5} />
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