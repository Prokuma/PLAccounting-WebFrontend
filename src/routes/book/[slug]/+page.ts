import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { apiURL, user, checkAuth } from '../../../store';
import type { APIBook } from '../../../apitype';
import { get } from 'svelte/store';
export const prerender = true;

export const load = (async ({ params }) => {
    return {
        bookId: params.slug
    }
}) satisfies PageLoad;