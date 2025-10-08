/**
 * DOM Utility - Helper functions for DOM manipulation
 * @module core/dom
 */

/**
 * Query selector shorthand
 */
export const $ = (selector, parent = document) => parent.querySelector(selector);
export const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

/**
 * Create element with attributes and children
 */
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'class') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });

    // Append children
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });

    return element;
}

/**
 * Show/hide element
 */
export function show(element, display = 'block') {
    if (typeof element === 'string') element = $(element);
    if (element) element.style.display = display;
}

export function hide(element) {
    if (typeof element === 'string') element = $(element);
    if (element) element.style.display = 'none';
}

export function toggle(element, display = 'block') {
    if (typeof element === 'string') element = $(element);
    if (!element) return;
    element.style.display = element.style.display === 'none' ? display : 'none';
}

/**
 * Add/remove class
 */
export function addClass(element, className) {
    if (typeof element === 'string') element = $(element);
    if (element) element.classList.add(className);
}

export function removeClass(element, className) {
    if (typeof element === 'string') element = $(element);
    if (element) element.classList.remove(className);
}

export function toggleClass(element, className) {
    if (typeof element === 'string') element = $(element);
    if (element) element.classList.toggle(className);
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Wait for DOM ready
 */
export function ready(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

export default {
    $,
    $$,
    createElement,
    show,
    hide,
    toggle,
    addClass,
    removeClass,
    toggleClass,
    escapeHtml,
    ready
};
