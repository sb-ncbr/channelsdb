/**
 * The behaviour of Bootstrap 3's tabs, dropdowns and tooltips used by the page, following Bootstrap 3.4.1's plugins
 * (which need jQuery). The markup and styles stay Bootstrap's.
 */

// Duration of the fade transition (.fade in Bootstrap's styles)
const transitionMs = 150;

// Position of the element's border box in the document, like jQuery's offset()
function getOffset(element: Element) {
    const rect = element.getBoundingClientRect();
    return { top: rect.top + window.scrollY, left: rect.left + window.scrollX };
}

// Moves a positioned element so that its border box is at the given position in the document, like jQuery's offset()
function setOffset(element: HTMLElement, offset: { top: number, left: number }, round = false) {
    const current = getOffset(element);
    const style = getComputedStyle(element);
    const position = (value: number) => `${round ? Math.round(value) : value}px`;
    element.style.top = position(offset.top - current.top + (parseFloat(style.top) || 0));
    element.style.left = position(offset.left - current.left + (parseFloat(style.left) || 0));
}

function showTab(link: HTMLElement) {
    const item = link.closest('li')!;
    if (item.classList.contains('active')) return;
    const pane = document.querySelector<HTMLElement>(link.getAttribute('href')!);
    if (!pane) return;

    const previousItem = link.closest('ul')!.querySelector(':scope > li.active');
    previousItem?.classList.remove('active');
    previousItem?.querySelectorAll('[data-toggle="tab"]').forEach((l) => l.setAttribute('aria-expanded', 'false'));
    item.classList.add('active');
    link.setAttribute('aria-expanded', 'true');

    // The previous pane fades out, then the new one fades in
    const previous = pane.parentElement!.querySelector<HTMLElement>(':scope > .active');
    const fade = previous?.classList.contains('fade') || pane.parentElement!.querySelector(':scope > .fade') !== null;
    const next = () => {
        previous?.classList.remove('active');
        pane.classList.add('active');
        if (fade) {
            void pane.offsetWidth; // start the transition from the hidden state
            pane.classList.add('in');
        } else {
            pane.classList.remove('fade');
        }
    };
    if (previous && fade) {
        window.setTimeout(next, transitionMs);
    } else {
        next();
    }
    previous?.classList.remove('in');
}

function closeDropdowns() {
    document.querySelectorAll('[data-toggle="dropdown"]').forEach((toggle) => {
        const parent = toggle.parentElement!;
        if (!parent.classList.contains('open')) return;
        parent.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
    });
}

function toggleDropdown(toggle: HTMLElement) {
    if (toggle.matches('.disabled, :disabled')) return;
    const parent = toggle.parentElement!;
    const wasOpen = parent.classList.contains('open');
    closeDropdowns();
    if (!wasOpen) {
        parent.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.focus();
    }
}

/** Handles the tabs and dropdowns of the page (elements with data-toggle="tab" or "dropdown") */
export function initTabsAndDropdowns() {
    document.addEventListener('click', (event) => {
        const target = event.target as Element;
        const tab = target.closest<HTMLElement>('[data-toggle="tab"]');
        if (tab) {
            event.preventDefault();
            showTab(tab);
        }
        const dropdown = target.closest<HTMLElement>('[data-toggle="dropdown"]');
        if (dropdown) {
            event.preventDefault();
            toggleDropdown(dropdown);
        } else {
            // Including the items of the menus
            closeDropdowns();
        }
    });
    document.addEventListener('keydown', (event) => {
        const target = event.target as HTMLElement;
        const element = target.closest<HTMLElement>('[data-toggle="dropdown"], .dropdown-menu');
        if (element) dropdownKeydown(event, element);
    });
}

// Keyboard control of the dropdowns: opening (Arrow keys, Space), moving between the items and closing (Escape)
function dropdownKeydown(event: KeyboardEvent, element: HTMLElement) {
    const target = event.target as HTMLElement;
    // Items without href are not links, so Enter activates them here
    if (event.key === 'Enter' && target.matches('.dropdown-menu a:not([href])')) {
        event.preventDefault();
        target.click();
        return;
    }
    if (!['ArrowUp', 'ArrowDown', 'Escape', ' '].includes(event.key) || /input|textarea/i.test(target.tagName)) return;
    event.preventDefault();
    event.stopPropagation();
    if (element.matches('.disabled, :disabled')) return;

    const parent = element.parentElement!;
    const toggle = parent.querySelector<HTMLElement>('[data-toggle="dropdown"]');
    const isOpen = parent.classList.contains('open');
    if ((!isOpen && event.key !== 'Escape') || (isOpen && event.key === 'Escape')) {
        if (event.key === 'Escape') toggle?.focus();
        (toggle ?? element).click();
        return;
    }

    const items = [...parent.querySelectorAll<HTMLElement>('.dropdown-menu li:not(.disabled) a')]
        .filter((item) => item.closest('li')!.getClientRects().length > 0);
    if (!items.length) return;
    let index = items.indexOf(target);
    if (event.key === 'ArrowUp' && index > 0) index--;
    if (event.key === 'ArrowDown' && index < items.length - 1) index++;
    if (index < 0) index = 0;
    // Items without href can take the focus only with a tabindex (-1: not in the Tab order)
    if (!items[index].hasAttribute('href') && !items[index].hasAttribute('tabindex')) items[index].tabIndex = -1;
    items[index].focus();
}

let tooltipCount = 0;

function placeTooltip(element: HTMLElement, tip: HTMLElement, placement: string) {
    const position = { ...getOffset(element), width: element.offsetWidth, height: element.offsetHeight };
    const width = tip.offsetWidth;
    const height = tip.offsetHeight;
    const offset =
        placement === 'bottom' ? { top: position.top + position.height, left: position.left + position.width / 2 - width / 2 } :
        placement === 'top' ? { top: position.top - height, left: position.left + position.width / 2 - width / 2 } :
        placement === 'left' ? { top: position.top + position.height / 2 - height / 2, left: position.left - width } :
        { top: position.top + position.height / 2 - height / 2, left: position.left + position.width };

    const style = getComputedStyle(tip);
    offset.top += parseInt(style.marginTop, 10) || 0;
    offset.left += parseInt(style.marginLeft, 10) || 0;
    setOffset(tip, offset, true);
    tip.classList.add('in');

    const actualWidth = tip.offsetWidth;
    const actualHeight = tip.offsetHeight;
    if (placement === 'top' && actualHeight !== height) offset.top += height - actualHeight;

    // Keep the tooltip in the window
    const delta = { top: 0, left: 0 };
    const isVertical = placement === 'top' || placement === 'bottom';
    if (isVertical) {
        const right = document.body.getBoundingClientRect().right;
        if (offset.left < 0) delta.left = -offset.left;
        else if (offset.left + actualWidth > right) delta.left = document.documentElement.clientWidth - (offset.left + actualWidth);
    } else {
        const top = offset.top - window.scrollY;
        const bottom = top + actualHeight;
        if (top < 0) delta.top = -top;
        else if (bottom > document.documentElement.clientHeight) delta.top = document.documentElement.clientHeight - bottom;
    }
    if (delta.left) offset.left += delta.left;
    else offset.top += delta.top;
    setOffset(tip, offset);

    const arrowDelta = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight;
    const arrow = tip.querySelector<HTMLElement>('.tooltip-arrow')!;
    arrow.style.setProperty(isVertical ? 'left' : 'top', `${50 * (1 - arrowDelta / (isVertical ? tip.offsetWidth : tip.offsetHeight))}%`);
    arrow.style.removeProperty(isVertical ? 'top' : 'left');
}

function addTooltip(element: HTMLElement, container?: HTMLElement) {
    let tip: HTMLElement | undefined;
    let shown = false;
    // Shown while hovered or focused
    const active = { hover: false, focus: false };
    const id = `tooltip${++tooltipCount}`;

    const show = () => {
        if (shown) return;
        shown = true;
        // The title is shown by the tooltip instead of the browser
        if (element.getAttribute('title')) {
            element.setAttribute('data-original-title', element.getAttribute('title')!);
            element.setAttribute('title', '');
        }
        const title = element.getAttribute('data-original-title');
        if (!title) return;

        const placement = element.getAttribute('data-placement') ?? 'top';
        tip?.remove();
        tip = document.createElement('div');
        tip.id = id;
        tip.className = `tooltip fade ${placement}`;
        tip.setAttribute('role', 'tooltip');
        tip.innerHTML = '<div class="tooltip-arrow"></div><div class="tooltip-inner"></div>';
        tip.querySelector('.tooltip-inner')!.textContent = title;
        Object.assign(tip.style, { top: '0', left: '0', display: 'block' });
        element.setAttribute('aria-describedby', id);
        if (container) container.appendChild(tip);
        else element.after(tip);
        placeTooltip(element, tip, placement);
    };

    const hide = () => {
        if (active.hover || active.focus) return;
        shown = false;
        const hiding = tip;
        if (!hiding) return;
        hiding.classList.remove('in');
        window.setTimeout(() => {
            if (shown || tip !== hiding) return;
            hiding.remove();
            tip = undefined;
            element.removeAttribute('aria-describedby');
        }, transitionMs);
    };

    const listen = (type: string, state: keyof typeof active, value: boolean) => element.addEventListener(type, () => {
        active[state] = value;
        if (value) show();
        else hide();
    });
    listen('mouseenter', 'hover', true);
    listen('mouseleave', 'hover', false);
    listen('focusin', 'focus', true);
    listen('focusout', 'focus', false);
}

/**
 * Shows the title of the matching elements as a tooltip, placed by their data-placement. It is inserted after the
 * element, or into the container.
 */
export function initTooltips(selector: string, options: { container?: HTMLElement } = {}) {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        if (element.dataset.tooltip) return;
        element.dataset.tooltip = 'true';
        addTooltip(element, options.container);
    });
}
