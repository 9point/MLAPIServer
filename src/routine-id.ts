import assert from 'assert';

import { Model as Project } from './models/Project';
import { Model as Task } from './models/Task';
import { Model as Workflow } from './models/Workflow';

export interface RoutineID$DB {
  dbID: string;
  type: 'tdb' | 'wfdb';
}

export interface RoutineID$Name {
  projectName: string | undefined;
  routineName: string;
  type: 'wfname' | 'tname';
  version: string | undefined;
}

export interface FullRoutineID$TName {
  projectName: string;
  routineName: string;
  type: 'tname';
  version: string;
}

export interface FullRoutineID$WFName {
  projectName: string;
  routineName: string;
  type: 'wfname';
  version: undefined;
}

export type RoutineID = RoutineID$DB | RoutineID$Name;

export type FullRoutineID =
  | RoutineID$DB
  | FullRoutineID$TName
  | FullRoutineID$WFName;

export function parse(str: string): RoutineID {
  const tokens = str.split(':');

  const type = tokens[0];

  const validTypes = ['tdb', 'wfdb', 'wfname', 'tname'];

  if (!validTypes.includes(type)) {
    throw new ErrorInvalidRoutineID(str);
  }

  switch (type) {
    case 'tdb':
    case 'wfdb': {
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
        if (type === 'wfname') {
          throw new ErrorInvalidRoutineID();
        }

        const [_, projectName, routineName, version] = tokens;
        return { projectName, routineName, type, version };
      } else if (tokens.length === 3 && type === 'wfname') {
        const [_, projectName, routineName] = tokens;
        return { projectName, routineName, type, version: undefined };
      } else if (tokens.length === 3 && type === 'tname') {
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

export function createNameBasedID(
  routine: Task | Workflow,
  project: Project,
): FullRoutineID$TName | FullRoutineID$WFName {
  switch (routine.modelType) {
    case 'Task': {
      return {
        projectName: project.name,
        routineName: routine.name,
        type: 'tname',
        version: routine.version,
      };
    }

    case 'Workflow': {
      return {
        projectName: project.name,
        routineName: routine.name,
        type: 'wfname',
        version: undefined,
      };
    }
  }
}

export function parseFull(str: string): FullRoutineID {
  const tokens = str.split(':');

  const type = tokens[0];

  const validTypes = ['tdb', 'wfdb', 'wfname', 'tname'];

  if (!validTypes.includes(type)) {
    throw new ErrorInvalidRoutineID(str);
  }

  switch (type) {
    case 'tdb':
    case 'wfdb': {
      if (tokens.length !== 2) {
        throw new ErrorInvalidFullRoutineID(str);
      }

      const dbID = tokens[1];
      return { dbID, type };
    }

    case 'wfname': {
      if (tokens.length !== 3) {
        throw new ErrorInvalidFullRoutineID(str);
      }
      const [_, projectName, routineName] = tokens;
      return { projectName, routineName, type, version: undefined };
    }

    case 'tname': {
      if (tokens.length !== 4) {
        throw new ErrorInvalidFullRoutineID(str);
      }

      const [_, projectName, routineName, version] = tokens;
      return { projectName, routineName, type, version };
    }
  }

  assert(false);
}

export function matches(rid1: RoutineID, rid2: RoutineID): boolean {
  if (rid1.type !== rid2.type) {
    return false;
  }

  switch (rid1.type) {
    case 'tdb':
    case 'wfdb': {
      assert(rid2.type === rid1.type);
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

export function toString(routineID: RoutineID): string {
  switch (routineID.type) {
    case 'tname':
    case 'wfname': {
      const { projectName, routineName, version } = routineID;
      let str = routineID.type;
      if (projectName) {
        str += `:${projectName}`;
      }

      str += `:${routineName}`;

      if (version) {
        str += `:${version}`;
      }

      return str;
    }

    case 'tdb':
    case 'wfdb': {
      const { dbID } = routineID;
      return `${routineID.type}:${dbID}`;
    }
  }
}

export function fromRoutine(routine: Task | Workflow): RoutineID;
export function fromRoutine(
  routine: Task | Workflow,
  project: Project,
): FullRoutineID;

export function fromRoutine(
  routine: Task | Workflow,
  project?: Project,
): RoutineID {
  if (project) {
    const projectName = project.name;
    const routineName = routine.name;

    switch (routine.modelType) {
      case 'Task': {
        const type = 'tname';
        const version = routine.version;
        return { projectName, routineName, type, version };
      }

      case 'Workflow': {
        const type = 'wfname';
        const version = undefined;
        return { projectName, routineName, type, version };
      }
    }
  } else {
    const type = routine.modelType === 'Task' ? 'tname' : 'wfname';
    const projectName = undefined;
    const version = routine.modelType === 'Task' ? routine.version : undefined;

    return {
      projectName,
      routineName: routine.name,
      type,
      version,
    };
  }
}

export class ErrorInvalidRoutineID extends Error {}

export class ErrorInvalidFullRoutineID extends Error {}
