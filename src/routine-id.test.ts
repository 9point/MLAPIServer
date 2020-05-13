import { parse, toString } from './routine-id';

describe('parse', () => {
  test('works with task names', () => {
    const id = parse('tname:hello-world');
    expect(id).toEqual({
      projectName: undefined,
      routineName: 'hello-world',
      type: 'tname',
      version: undefined,
    });
  });

  test('works with workflow names', () => {
    const id = parse('wfname:hello');
    expect(id).toEqual({
      projectName: undefined,
      routineName: 'hello',
      type: 'wfname',
      version: undefined,
    });
  });
});
