function createStateMachine() {
  const STATES = { IDLE: 'IDLE', LICKING: 'LICKING', LYING_DOWN: 'LYING_DOWN', BOUNCING: 'BOUNCING' };
  let currentState = 'IDLE';
  let idleTimer = null;
  let onChange = null;

  function transition(newState) {
    if (newState === currentState) return;

    // Guard: LICKING not allowed during LYING_DOWN
    if (currentState === STATES.LYING_DOWN && newState === STATES.LICKING) return;
    // Guard: BOUNCING blocks everything until it completes
    if (currentState === STATES.BOUNCING && newState !== STATES.IDLE) return;

    currentState = newState;
    resetIdleTimer();

    if (onChange) onChange(currentState);
  }

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    if (currentState === STATES.IDLE) {
      idleTimer = setTimeout(() => {
        transition(STATES.LYING_DOWN);
      }, 30000);
    }
  }

  function getState() {
    return currentState;
  }

  function onStateChange(cb) {
    onChange = cb;
  }

  function isIdle() {
    return currentState === STATES.IDLE;
  }

  function isLyingDown() {
    return currentState === STATES.LYING_DOWN;
  }

  return { transition, getState, onStateChange, isIdle, isLyingDown, STATES };
}
