import {
  isEmbedded,
  isParentCommand,
  notifyParent,
} from '../Embedded';

describe('Embedded', () => {
  it('should not be embedded in a top level window', () => {
    expect(isEmbedded()).toBeFalsy();
  });

  it('should not notify a parent when not embedded', () => {
    const postMessage = jest.spyOn(window.parent, 'postMessage');
    notifyParent('connected');
    expect(postMessage).not.toHaveBeenCalled();
    postMessage.mockRestore();
  });

  it('should only accept commands from the same origin', () => {
    const data = {
      source: 'trueglide-configurator',
      command: 'disconnect',
    };

    expect(isParentCommand({
      origin: window.location.origin,
      data,
    }, 'disconnect')).toBeTruthy();

    expect(isParentCommand({
      origin: 'https://example.com',
      data,
    }, 'disconnect')).toBeFalsy();

    expect(isParentCommand({
      origin: window.location.origin,
      data: {
        ...data,
        source: 'other',
      },
    }, 'disconnect')).toBeFalsy();

    expect(isParentCommand({
      origin: window.location.origin,
      data,
    }, 'connect')).toBeFalsy();
  });
});
