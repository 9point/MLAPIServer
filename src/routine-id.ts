import assert from 'assert';

export interface RoutineID$DB {
  type: 'DB';
  dbID: string;
}

export interface RoutineID$Name {
  projectName: string | undefined;
  routineName: string;
  type: 'NAME';
  version: string | undefined;
}

export type RoutineID = RoutineID$DB | RoutineID$Name;

export function fromDBID(id: string): RoutineID {
  return { dbID: id, type: 'DB' };
}

export function parse(str: string): RoutineID {
  const tokens = str.split(':');

  assert([3, 2, 1].includes(tokens.length));

  if (tokens.length === 3) {
    const [projectName, routineName, version] = tokens;
    return {
      projectName,
      routineName,
      type: 'NAME',
      version,
    };
  } else if (tokens.length === 2) {
    const [routineName, version] = tokens;
    return {
      projectName: undefined,
      routineName,
      type: 'NAME',
      version,
    };
  } else if (tokens.length === 1) {
    const [routineName] = tokens;
    return {
      projectName: undefined,
      routineName,
      type: 'NAME',
      version: undefined,
    };
  }

  assert(false);
}

export function matches(rid1: RoutineID, rid2: RoutineID): boolean {
  if (rid1.type !== rid2.type) {
    return false;
  }

  switch (rid1.type) {
    case 'DB': {
      assert(rid2.type === 'DB');
      return rid1.dbID === rid2.dbID;
    }

    case 'NAME': {
      assert(rid2.type === 'NAME');

      if (
        rid1.projectName &&
        rid2.projectName &&
        rid1.projectName !== rid2.projectName
      ) {
        return false;
      }

      if (
        rid1.projectName &&
        rid2.projectName &&
        rid1.projectName !== rid2.projectName
      ) {
        return false;
      }

      if (rid1.routineName !== rid2.routineName) {
        return false;
      }

      return !rid1.version || !rid2.version || rid1.version === rid2.version;
    }
  }
}
