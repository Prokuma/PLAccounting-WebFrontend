import type { PageLoad } from './$types';
export const prerender = true;

export const load = (async ({ params }) => {
    return {
        bookId: params.slug
    }
}) satisfies PageLoad;