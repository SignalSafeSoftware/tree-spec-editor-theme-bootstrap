/** Controlled browser adapter for script control-flow and metric-boundary unit tests.
 * Actual Chromium geometry remains a separate packed-theme regression gate.
 */
const key = Symbol.for('tree-theme-browser-test-state');
export function state() {
    return (globalThis[key] ??= { width: 320, fontSize: 16, fault: '', events: [], closed: 0 });
}

function element(name, { label = null, width = 200, scrollWidth = width, parent = null } = {}) {
    return {
        name,
        label,
        clientWidth: width,
        scrollWidth,
        selectedOptions: [{ text: label ?? 'Label' }],
        textContent: name,
        getAttribute: () => label,
        getBoundingClientRect: () => ({ top: 0, bottom: 20, left: 0, right: width, width }),
        scrollIntoView() {},
        closest: () => parent,
    };
}
function installDocument() {
    const s = state();
    const card = element('card', { width: 250 });
    const scroll = { ...card, contains: (control) => control.name !== 'wrap' };
    const selects = [
        element('type', { label: 'Type', parent: card }),
        element('outcome', { label: 'Outcome', parent: card }),
        element('wrap', { label: 'Appearance wrap', parent: card }),
    ];
    const label = element('label');
    const control = element('input', { parent: card });
    if (s.fault === 'unreadable') selects[0].clientWidth = 10;
    if (s.fault === 'unreachable')
        control.getBoundingClientRect = () => ({ top: -10, bottom: 20, left: 0, right: 200 });
    const cell = element('cell', {
        width: 100,
        scrollWidth: s.fault === 'cell-scroll' ? 200 : 100,
    });
    const body = { clientWidth: 200 };
    const table = {
        parentElement: body,
        getBoundingClientRect: () => ({
            width: s.fault === 'table-overflow' ? 300 : 200,
            right: 200,
        }),
        querySelectorAll: () => [cell],
        querySelector: () => cell,
    };
    globalThis.innerWidth = s.width;
    globalThis.getComputedStyle = () => ({
        fontSize: `${s.fontSize}px`,
        fontFamily: 'Arial',
        paddingLeft: s.fault === 'padding' ? '1px' : `${s.fontSize * 0.75}px`,
        paddingRight: '12px',
    });
    globalThis.document = {
        documentElement: { scrollWidth: s.width + (s.fault === 'document-overflow' ? 10 : 0) },
        querySelector(selector) {
            if (selector === 'table') return table;
            if (selector === '.graph-editor-scroll') return scroll;
            if (selector === '.graph-editor-card__body--flush') return { name: 'flush' };
            return { name: 'body' };
        },
        querySelectorAll(selector) {
            if (selector === '.graph-editor-field select') return selects;
            if (selector === '.graph-editor-field__label') return [label];
            return [...selects, control];
        },
        createElement: () => ({
            getContext: () => ({ font: '', measureText: (text) => ({ width: text.length * 5 }) }),
        }),
        createRange() {
            let selected;
            return {
                selectNodeContents(node) {
                    selected = node;
                },
                getClientRects() {
                    return (s.fault === 'label-overlap' && selected === label) ||
                        (s.fault === 'cell-text' && selected === cell)
                        ? [{ left: -10, right: 300 }]
                        : s.fault === 'cell-text-right' && selected === cell
                          ? [{ left: 0, right: 300 }]
                          : [];
                },
            };
        },
    };
    const style = globalThis.getComputedStyle;
    globalThis.getComputedStyle = (target) =>
        target.name === 'flush' ? { paddingLeft: '0px' } : style(target);
}

export const chromium = {
    async launch() {
        const s = state();
        s.events.push('launch');
        if (s.fault === 'launch') throw new Error('launch failed');
        return {
            async close() {
                s.closed++;
                s.events.push('close');
            },
            async newPage() {
                if (s.fault === 'new-page') throw new Error('new page failed');
                return {
                    async setViewportSize({ width }) {
                        if (s.busy) throw new Error('cases overlapped');
                        s.busy = true;
                        s.width = width;
                        s.events.push(`viewport:${width}`);
                        await Promise.resolve();
                    },
                    async setContent(html) {
                        s.fontSize = Number(/font-size:(\d+)px/.exec(html)[1]);
                        s.events.push(`content:${s.fontSize}`);
                    },
                    async addStyleTag({ content }) {
                        if (!content.includes('graph-editor'))
                            throw new Error('Missing actual CSS');
                    },
                    async evaluate(callback) {
                        installDocument();
                        try {
                            return callback();
                        } finally {
                            s.busy = false;
                        }
                    },
                };
            },
        };
    },
};
