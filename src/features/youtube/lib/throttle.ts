export const throttle = <TArgs extends readonly unknown[]>(
    fn: (...args: TArgs) => void,
    waitMs: number
): ((...args: TArgs) => void) => {
    let last = 0;
    let timeout: number | null = null;
    let lastArgs: TArgs | null = null;

    const run = () => {
        timeout = null;
        last = Date.now();
        if (!lastArgs) return;
        fn(...lastArgs);
        lastArgs = null;
    };

    return (...args: TArgs) => {
        lastArgs = args;
        const now = Date.now();
        const remaining = waitMs - (now - last);
        if (remaining <= 0) {
            if (timeout) {
                window.clearTimeout(timeout);
                timeout = null;
            }
            run();
            return;
        }
        if (!timeout) {
            timeout = window.setTimeout(run, remaining);
        }
    };
};


