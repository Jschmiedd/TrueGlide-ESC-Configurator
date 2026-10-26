/**
 * Embedded mode: the configurator is shown inside another page of the same
 * site (for example the ESC tab of TrueGlide Configurator).
 *
 * Messages are only exchanged with a parent page of the same origin.
 */
const SOURCE = 'trueglide-esc';
const PARENT_SOURCE = 'trueglide-configurator';

function isEmbedded() {
  try {
    return window.self !== window.top;
  } catch(e) {
    return true;
  }
}

function notifyParent(event) {
  if(isEmbedded()) {
    window.parent.postMessage({
      source: SOURCE,
      event,
    }, window.location.origin);
  }
}

function isParentCommand(message, command) {
  return (
    message.origin === window.location.origin &&
    message.data &&
    message.data.source === PARENT_SOURCE &&
    message.data.command === command
  );
}

export {
  isEmbedded,
  isParentCommand,
  notifyParent,
};
