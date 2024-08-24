import { transformKeys } from './camelCase.ts';

describe('transformKeys', () => {
  it('should transform kebab-case keys to camelCase', () => {
    const input = {
      'first-key': 'value1',
      'second-key': 'value2'
    };
    const expectedOutput = {
      firstKey: 'value1',
      secondKey: 'value2'
    };
    expect(transformKeys(input)).toEqual(expectedOutput);
  });

  it('should transform only kebab-case keys and leave camelCase keys unchanged', () => {
    const input = {
      'first-key': 'value1',
      secondKey: 'value2'
    };
    const expectedOutput = {
      firstKey: 'value1',
      secondKey: 'value2'
    };
    expect(transformKeys(input)).toEqual(expectedOutput);
  });

  it('should leave an object with no kebab-case keys unchanged', () => {
    const input = {
      firstKey: 'value1',
      secondKey: 'value2'
    };
    const expectedOutput = {
      firstKey: 'value1',
      secondKey: 'value2'
    };
    expect(transformKeys(input)).toEqual(expectedOutput);
  });

  it('should return an empty object when given an empty object', () => {
    const input = {};
    const expectedOutput = {};
    expect(transformKeys(input)).toEqual(expectedOutput);
  });

  it('should not recursively transform keys in nested objects', () => {
    const input = {
      'outer-key': {
        'inner-key': 'value'
      }
    };
    const expectedOutput = {
      outerKey: {
        'inner-key': 'value'
      }
    };
    expect(transformKeys(input)).toEqual(expectedOutput);
  });
});