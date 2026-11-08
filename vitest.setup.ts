import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';
import { expect as expectBase, beforeEach } from 'vitest';
import { extendExpect } from '@testing-library/jest-dom';

extendExpect(expectBase, matchers);

beforeEach(() => {
  // Setup any global mocks or state here
});

afterEach(() => {
  cleanup();
});