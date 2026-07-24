import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BrowserOpenURL } from "../../wailsjs/runtime/runtime";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function sanitizePath(input: string, _os: string): string {
    const sanitized = input.trim();
    return sanitized.replace(/[<>:"/\\|?*]/g, "_");
}

export function openExternal(url: string) {
    if (!url)
        return;
    try {
        BrowserOpenURL(url);
    }
    catch (error) {
        if (typeof window !== "undefined") {
            window.open(url, "_blank", "noopener,noreferrer");
        }
    }
}
