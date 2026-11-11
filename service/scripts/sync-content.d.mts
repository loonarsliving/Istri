export function collect(): Record<string, { path: string; text: string }[]>;
export function render(content: Record<string, { path: string; text: string }[]>): string;
