import { writable } from "svelte/store";
import { v4 as uuidv4 } from 'uuid';
import type { APIUser } from "./apitype";
import { PUBLIC_API_ADDR } from "$env/static/public";

export const apiURL = `${PUBLIC_API_ADDR}/api/v1`;
export const accountTitleTypeString = ['資産', '負債', '支出', '収入'];

export type ToastNotificationData = {
    id: string;
    title: string;
    subtitle: string;
    caption: string;
    timeout: number;
    type: 'error' | 'success';
}
export const user = writable<APIUser | null>(null);
export const toastNotifications = writable<ToastNotificationData[]>([]);

export function addToastNotification(notification: ToastNotificationData) {
    notification.id = uuidv4();

    toastNotifications.update((notifications) => [...notifications, notification]);
    if (notification.timeout) setTimeout(() => dismissToastNotification(notification.id), notification.timeout);
}

export function dismissToastNotification(id: string) {
    toastNotifications.update((notifications) => notifications.filter((n) => n.id !== id));
}

export async function checkAuth() {
    const res = await fetch(`${apiURL}/user`, {
        credentials: 'include',
    });
    if (res.ok) {
        const data = await res.json();
        user.set(data);
    }
}
checkAuth();