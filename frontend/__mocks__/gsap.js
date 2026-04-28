const tlMock = {
  to: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  fromTo: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  kill: jest.fn().mockReturnThis(),
  play: jest.fn().mockReturnThis(),
  pause: jest.fn().mockReturnThis(),
  reverse: jest.fn().mockReturnThis(),
  eventCallback: jest.fn().mockReturnThis(),
};

const gsapMock = {
  to: jest.fn(() => ({})),
  from: jest.fn(() => ({})),
  fromTo: jest.fn(() => ({})),
  set: jest.fn(() => ({})),
  kill: jest.fn(),
  timeline: jest.fn(() => ({ ...tlMock })),
  ticker: { add: jest.fn(), remove: jest.fn(), fps: jest.fn() },
  registerPlugin: jest.fn(),
  getById: jest.fn(),
  context: jest.fn(() => ({ revert: jest.fn(), kill: jest.fn() })),
  matchMedia: jest.fn(() => ({ add: jest.fn(), revert: jest.fn() })),
  defaults: jest.fn(),
  globalTimeline: { pause: jest.fn(), play: jest.fn() },
};

module.exports = gsapMock;
module.exports.default = gsapMock;
module.exports.gsap = gsapMock;
