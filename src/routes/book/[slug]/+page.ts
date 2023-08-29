import type { PageLoad } from './$types';
export const prerender = false;

export const load = (async ({ params }) => {
    return {
        bookId: params.slug
    }
}) satisfies PageLoad;