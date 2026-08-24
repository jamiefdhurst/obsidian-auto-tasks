/**
 * Obsidian DOM shim for plain jsdom.
 *
 * Obsidian extends the standard DOM with its own helpers (createEl and friends,
 * plus a handful of prototype extensions) which are not part of jsdom. This
 * reimplements the parts the plugin actually uses, so the suite can run on the
 * maintained jsdom environment rather than the archived jest-environment-obsidian.
 *
 * Adapted from the same shim in obsidian-inbox-organiser.
 */

interface ElInfo {
  cls?: string;
  text?: string;
  type?: string;
  attr?: Record<string, string>;
}

/**
 * Obsidian accepts either an info object or a bare class name as the second
 * argument to createEl and createDiv, so both forms are normalised here.
 */
function _normaliseInfo(info?: ElInfo | string): ElInfo | undefined {
  return typeof info === 'string' ? { cls: info } : info;
}

function _applyInfo(el: Element, info?: ElInfo | string, callback?: (el: any) => void): void {
  const normalised = _normaliseInfo(info);
  // setAttribute rather than className, which is read-only on SVG elements
  if (normalised?.cls) el.setAttribute('class', normalised.cls);
  if (normalised?.text) el.textContent = normalised.text;
  if (normalised?.type && el instanceof HTMLInputElement) el.type = normalised.type;
  if (normalised?.attr) {
    Object.entries(normalised.attr).forEach(([k, v]) => el.setAttribute(k, v));
  }
  if (callback) callback(el);
}

function _createEl(
  tag: string,
  info?: ElInfo | string,
  callback?: (el: HTMLElement) => void
): HTMLElement {
  const el = document.createElement(tag);
  _applyInfo(el, info, callback);
  return el;
}

function _createSvg(
  tag: string,
  info?: ElInfo | string,
  callback?: (el: SVGElement) => void
): SVGElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  _applyInfo(el, info, callback);
  return el;
}

// Global Obsidian DOM helpers
(globalThis as any).createEl = _createEl;
(globalThis as any).createDiv = (info?: any, callback?: any) => _createEl('div', info, callback);
(globalThis as any).createSpan = (info?: any, callback?: any) => _createEl('span', info, callback);
(globalThis as any).createSvg = _createSvg;

// Node prototype extensions
(Node.prototype as any).createEl = function (tag: any, info?: any, callback?: any) {
  const el = _createEl(tag, info, callback);
  this.appendChild(el);
  return el;
};
(Node.prototype as any).createDiv = function (info?: any, callback?: any) {
  return this.createEl('div', info, callback);
};
(Node.prototype as any).createSpan = function (info?: any, callback?: any) {
  return this.createEl('span', info, callback);
};
(Node.prototype as any).createSvg = function (tag: any, info?: any, callback?: any) {
  const el = _createSvg(tag, info, callback);
  this.appendChild(el);
  return el;
};
(Node.prototype as any).empty = function () {
  while (this.firstChild) this.removeChild(this.firstChild);
};
(Node.prototype as any).detach = function () {
  this.parentNode?.removeChild(this);
};
(Node.prototype as any).appendText = function (val: string) {
  this.appendChild(document.createTextNode(val));
};

// Element prototype extensions
(Element.prototype as any).find = function (selector: string) {
  return this.querySelector(selector);
};
(Element.prototype as any).findAll = function (selector: string) {
  return Array.from(this.querySelectorAll(selector));
};
(Element.prototype as any).getText = function () {
  return this.textContent;
};
(Element.prototype as any).setText = function (val: string) {
  this.textContent = val;
};
(Element.prototype as any).addClass = function (...classes: string[]) {
  this.classList.add(...classes);
};
(Element.prototype as any).removeClass = function (...classes: string[]) {
  this.classList.remove(...classes);
};
(Element.prototype as any).toggleClass = function (classes: string | string[], value: boolean) {
  const list = Array.isArray(classes) ? classes : [classes];
  list.forEach((cls) => this.classList.toggle(cls, value));
};
(Element.prototype as any).hasClass = function (cls: string) {
  return this.classList.contains(cls);
};
(Element.prototype as any).setAttr = function (name: string, value: string) {
  this.setAttribute(name, String(value));
};
(Element.prototype as any).getAttr = function (name: string) {
  return this.getAttribute(name);
};

// HTMLElement prototype extensions
(HTMLElement.prototype as any).show = function () {
  this.style.display = '';
};
(HTMLElement.prototype as any).hide = function () {
  this.style.display = 'none';
};

// String prototype extensions
(String.prototype as any).contains = function (target: string) {
  return this.includes(target);
};

// Array prototype extensions
(Array.prototype as any).contains = function (item: any) {
  return this.includes(item);
};
(Array.prototype as any).first = function () {
  return this[0];
};
(Array.prototype as any).last = function () {
  return this[this.length - 1];
};
(Array.prototype as any).remove = function (target: any) {
  const i = this.indexOf(target);
  if (i > -1) this.splice(i, 1);
};
