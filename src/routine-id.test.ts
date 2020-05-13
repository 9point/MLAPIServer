import { matches, parse, toString } from './routine-id';

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

  test('works with workflow names containing projects', () => {
    const id = parse('wfname:hello:world');
    expect(id).toEqual({
      projectName: 'hello',
      routineName: 'world',
      type: 'wfname',
      version: undefined,
    });
  });
});

describe('matches', () => {
  test('matches same workflow.', () => {
    const wf1 = parse('wfname:test-proj:test-routine');
    const wf2 = parse('wfname:test-proj:test-routine');
    expect(matches(wf1, wf2));
  });
});
