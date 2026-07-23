import type { IconifyIcon } from '@iconify/vue'

const stroke = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"'

export const animationIcons: Record<string, IconifyIcon> = {
    back: {
        body: `<path ${stroke} d="M19 12H5m6-6-6 6 6 6"/>`,
        width: 24,
        height: 24,
    },
    clockwise: {
        body: `<path ${stroke} d="M4 12a8 8 0 1 0 3-6.2"/><path ${stroke} d="M4 4v5h5"/>`,
        width: 24,
        height: 24,
    },
    previous: {
        body: `<path ${stroke} d="m14 5-7 7 7 7m7-14-7 7 7 7"/>`,
        width: 24,
        height: 24,
    },
    next: {
        body: `<path ${stroke} d="m10 5 7 7-7 7M3 5l7 7-7 7"/>`,
        width: 24,
        height: 24,
    },
    play: {
        body: '<path fill="currentColor" d="M8 5v14l11-7z"/>',
        width: 24,
        height: 24,
    },
    pause: {
        body: '<path fill="currentColor" d="M7 5h4v14H7zm6 0h4v14h-4z"/>',
        width: 24,
        height: 24,
    },
    enter: {
        body: `<path ${stroke} d="M5 12h12m-5-5 5 5-5 5M4 4v3a5 5 0 0 0 5 5"/>`,
        width: 24,
        height: 24,
    },
}
