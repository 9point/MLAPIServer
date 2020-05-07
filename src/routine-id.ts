import assert from 'assert';

export interface RoutineID$DB {
  dbID: string;
  type: 'db';
}

export interface RoutineID$Name {
  projectName: string | undefined;
  routineName: string;
  type: 'wfname' | 'tname';
  version: string | undefined;
}

export type RoutineID = RoutineID$DB | RoutineID$Name;

export function parse(str: string): RoutineID {
  const tokens = str.split(':');

  const type = tokens[0];

  const validTypes = ['db', 'wfname', 'tname'];

  if (!validTypes.includes(type)) {
    throw new ErrorInvalidRoutineID(str);
  }

  switch (type) {
    case 'db': {
      if (tokens.length !== 2) {
        throw new ErrorInvalidRoutineID(str);
      }

      const dbID = tokens[1];
      return { dbID, type };
    }

    case 'wfname':
    case 'tname': {
      if (![4, 3, 2].includes(tokens.length)) {
        throw new ErrorInvalidRoutineID(str);
      }

      if (tokens.length === 4) {
        const [_, projectName, routineName, version] = tokens;
        return { projectName, routineName, type, version };
      } else if (tokens.length === 3) {
        const [_, routineName, version] = tokens;
        return { projectName: undefined, routineName, type, version };
      } else {
        const routineName = tokens[1];
        return {
          projectName: undefined,
          routineName,
          type,
          version: undefined,
        };
      }
    }
  }

  assert(false);
}

export function matches(rid1: RoutineID, rid2: RoutineID): boolean {
  if (rid1.type !== rid2.type) {
    return false;
  }

  switch (rid1.type) {
    case 'db': {
      assert(rid2.type === 'db');
      return rid1.dbID === rid2.dbID;
    }

    case 'tname':
    case 'wfname': {
      assert(rid2.type === rid1.type);

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

export class ErrorInvalidRoutineID extends Error {}
