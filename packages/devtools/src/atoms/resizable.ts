import { command, state } from 'ccstate';

const maskElement$ = state<HTMLDivElement | undefined>(undefined);

const appendMaskElement$ = command(({ set }, axis, signal: AbortSignal) => {
  const mask = document.createElement('div');
  mask.style.position = 'fixed';
  mask.style.top = '0';
  mask.style.left = '0';
  mask.style.width = '100%';
  mask.style.height = '100%';
  mask.style.backgroundColor = 'transparent';
  mask.style.pointerEvents = 'auto';
  mask.style.cursor = axis === 'horizontal' ? 'ew-resize' : 'ns-resize';
  mask.style.zIndex = '9999';
  set(maskElement$, mask);
  document.body.appendChild(mask);
  signal.addEventListener('abort', () => {
    mask.remove();
    set(maskElement$, undefined);
  });

  return mask;
});

const isResizing$ = state(false);
const startPos$ = state(0);
const startSize$ = state(0);

const draggingController$ = state<AbortController | undefined>(undefined);

const handleMouseDown$ = command(
  ({ get, set }, e: MouseEvent, targetElem: HTMLElement, axis: 'horizontal' | 'vertical', signal: AbortSignal) => {
    get(draggingController$)?.abort();
    const controller = new AbortController();
    set(draggingController$, controller);
    const inDraggingSignal = AbortSignal.any([signal, controller.signal]);

    set(isResizing$, true);
    inDraggingSignal.addEventListener('abort', () => {
      set(isResizing$, false);
    });

    set(appendMaskElement$, axis, inDraggingSignal);

    set(startPos$, axis === 'horizontal' ? e.clientX : e.clientY);

    const rect = targetElem.getBoundingClientRect();
    set(startSize$, axis === 'horizontal' ? rect.width : rect.height);

    document.addEventListener(
      'mousemove',
      (e) => {
        set(handleMouseMove$, e, axis, targetElem);
      },
      { signal: inDraggingSignal },
    );

    document.addEventListener(
      'mouseup',
      () => {
        controller.abort();
        set(draggingController$, undefined);
      },
      { signal: inDraggingSignal },
    );
  },
);

const handleMouseMove$ = command(({ get }, e: MouseEvent, axis: 'horizontal' | 'vertical', targetElem: HTMLElement) => {
  if (!get(isResizing$)) return;

  const delta = axis === 'horizontal' ? e.clientX - get(startPos$) : e.clientY - get(startPos$);
  const newSizePixels = get(startSize$) + delta;
  if (axis === 'horizontal') {
    targetElem.style.width = String(newSizePixels) + 'px';
  } else {
    targetElem.style.height = String(newSizePixels) + 'px';
  }
});

export const resizable = command(
  (
    { set },
    handlerElem: HTMLElement,
    targetElem: HTMLElement,
    axis: 'horizontal' | 'vertical',
    signal: AbortSignal,
  ) => {
    handlerElem.addEventListener(
      'mousedown',
      (e) => {
        set(handleMouseDown$, e, targetElem, axis, signal);
      },
      { signal },
    );
  },
);
