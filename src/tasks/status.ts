export const STATUS_OPEN: string = ' ';
export const STATUS_COMPLETE: string = 'x';
export const STATUS_NOT_NEEDED: string = 'n';

// Any single character can act as a status - themes and the Tasks plugin both
// support custom ones such as [>] or [/]. Digits are excluded so that markdown
// footnote references like "- [1] See below" are not mistaken for tasks
export const STATUS_CHAR: string = String.raw`[^\d\]]`;
export const TASK_LINE: RegExp = new RegExp(String.raw`^\s*-\s\[${STATUS_CHAR}\](?:\s|$)`);
export const TASK_STATUS: RegExp = new RegExp(String.raw`^\s*-\s\[(${STATUS_CHAR})\](?:\s|$)`);
