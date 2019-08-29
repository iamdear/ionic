import { readTask, writeTask } from '@stencil/core';

const TRANSITION = 'all 0.2s ease-in-out';

export const cloneElement = (tagName: string) => {
  const getCachedEl = document.querySelector(`${tagName}.ion-cloned-element`);
  if (getCachedEl !== null) { return getCachedEl; }

  const clonedEl = document.createElement(tagName);
  clonedEl.classList.add('ion-cloned-element');
  clonedEl.style.setProperty('display', 'none');
  document.body.appendChild(clonedEl);

  return clonedEl;
};

export const createHeaderIndex = (headerEl: any): any | undefined => {
  if (!headerEl) { return; }

  const toolbars = headerEl.querySelectorAll('ion-toolbar');

  return {
    el: headerEl,
    toolbars: Array.from(toolbars).map((toolbar: any) => {
      const ionTitleEl = toolbar.querySelector('ion-title');
      return {
        el: toolbar,
        background: toolbar.shadowRoot!.querySelector('.toolbar-background'),
        ionTitleEl,
        innerTitleEl: (ionTitleEl) ? ionTitleEl.shadowRoot!.querySelector('.toolbar-title') : null,
        ionButtonsEl: Array.from(toolbar.querySelectorAll('ion-buttons'))
      };
    })
  };
};

const clampValue = (value: number, max: number, min: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const handleContentScroll = (scrollEl: any, mainHeaderIndex: any, scrollHeaderIndex: any, remainingHeight = 0) => {
  readTask(() => {
    const scrollTop = scrollEl.scrollTop;

    const lastMainToolbar = mainHeaderIndex.toolbars[mainHeaderIndex.toolbars.length - 1];
    const scale = clampValue(1 + (-scrollTop / 500), 1.1, 1);

    const borderOpacity = clampValue((scrollTop - remainingHeight) / lastMainToolbar.el.clientHeight, 1, 0);
    const maxOpacity = 1;
    const scaledOpacity = borderOpacity * maxOpacity;

    writeTask(() => {
      scaleLargeTitles(scrollHeaderIndex.toolbars, scale);
      setToolbarBackgroundOpacity(mainHeaderIndex.toolbars[0], scaledOpacity);
    });
  });
};

const setToolbarBackgroundOpacity = (toolbar: any, opacity = 1) => {
  toolbar.background.style.setProperty('--opacity', opacity);
};

/**
 * If toolbars are intersecting, hide the scrollable toolbar content
 * and show the primary toolbar content. If the toolbars are not intersecting,
 * hide the primary toolbar content and show the scrollable toolbar content
 */
export const handleToolbarIntersection = (ev: any, mainHeaderIndex: any, scrollHeaderIndex: any) => {
  writeTask(() => {
    const event = ev[0];
    const intersectionArea = event.intersectionRect.width * event.intersectionRect.height;
    const rootArea = event.rootBounds.width * event.rootBounds.height;

    const isPageHidden = intersectionArea === 0 && rootArea === 0;
    const isPageTransitioning = intersectionArea > 0 && (event.intersectionRect.left !== event.rootBounds.left || event.intersectionRect.right !== event.rootBounds.right);

    if (isPageHidden || isPageTransitioning) {
      return;
    }

    if (event.isIntersecting) {
      setHeaderActive(mainHeaderIndex, false);
      setHeaderActive(scrollHeaderIndex);
    } else {
      setHeaderActive(mainHeaderIndex);
      setHeaderActive(scrollHeaderIndex, false);
    }
  });
};

export const setHeaderActive = (headerIndex: any, active = true) => {
  writeTask(() => {
    if (active) {
      headerIndex.el.classList.remove('header-collapse-ios-inactive');
    } else {
      headerIndex.el.classList.add('header-collapse-ios-inactive');
    }
    setToolbarBackgroundOpacity(headerIndex.toolbars[0], (active) ? 1 : 0);
  });
};

export const scaleLargeTitles = (toolbars: any[] = [], scale = 1, transition = false) => {
  toolbars.forEach(toolbar => {

    const ionTitle = toolbar.ionTitleEl;
    if (!ionTitle || ionTitle.size !== 'large') { return; }

    const titleDiv = toolbar.innerTitleEl;
    if (titleDiv === null) { return; }

    titleDiv.style.transformOrigin = 'left center';
    titleDiv.style.transition = (transition) ? TRANSITION : '';
    titleDiv.style.transform = `scale3d(${scale}, ${scale}, 1)`;
  });
};
