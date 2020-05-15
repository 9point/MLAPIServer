import { matches, parse, parseFull, toString } from './routine-id';

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

  test('works with task names containing versions', () => {
    const id = parse('tname:hello-world:1.0.1');
    expect(id).toEqual({
      projectName: undefined,
      routineName: 'hello-world',
      type: 'tname',
      version: '1.0.1',
    });
  });

  test('works with task names containing project names', () => {
    const id = parse('tname:proj:hello:1.0.1');
    expect(id).toEqual({
      projectName: 'proj',
      routineName: 'hello',
      type: 'tname',
      version: '1.0.1',
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

describe('parseFull', () => {
  test('works with task names', () => {
    const id = parseFull('tname:proj:hello:1.0.1');
    expect(id).toEqual({
      projectName: 'proj',
      routineName: 'hello',
      type: 'tname',
      version: '1.0.1',
    });
  });
});

describe('toString', () => {
  test('converts task routine id to string', () => {
    expect(toString(parse('tname:proj:hello:1.0.1'))).toBe(
      'tname:proj:hello:1.0.1',
    );
  });
});
