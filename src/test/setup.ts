import "@testing-library/jest-dom";
import "fake-indexeddb/auto";

// jsdom Polyfills
Element.prototype.scrollIntoView = () => {};

