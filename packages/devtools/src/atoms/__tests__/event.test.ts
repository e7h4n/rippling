import { vi, expect, test } from 'vitest';
import { chrome } from 'e7h4n-vitest-chrome';

test('chrome api events', () => {
  const listenerSpy = vi.fn();
  const sendResponseSpy = vi.fn();

  chrome.runtime.onMessage.addListener(listenerSpy);

  expect(listenerSpy).not.toBeCalled();
  expect(chrome.runtime.onMessage.hasListeners()).toBe(true);

  chrome.runtime.onMessage.callListeners(
    { greeting: 'hello' }, // message
    {}, // MessageSender object
    sendResponseSpy, // SendResponse function
  );

  expect(listenerSpy).toBeCalledWith({ greeting: 'hello' }, {}, sendResponseSpy);
  expect(sendResponseSpy).not.toBeCalled();
});
