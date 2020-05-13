import * as DB from '.';
import ProjectModule, { Model as Project } from '../models/Project';
import TaskModule, { Model as Task } from '../models/Task';
import WorkflowModule, { Model as Workflow } from '../models/Workflow';

import { FullRoutineID } from '../routine-id';

export async function genRoutine(
  id: FullRoutineID,
): Promise<Task | Workflow | null> {
  switch (id.type) {
    case 'tdb': {
      return await DB.genFetchModel(TaskModule, id.dbID);
    }

    case 'wfdb': {
      return await DB.genFetchModel(WorkflowModule, id.dbID);
    }

    case 'tname': {
      const project = await genProjectFromName(id.projectName);

      if (!project) {
        return null;
      }

      const query = DB.createQuery(TaskModule, (_) =>
        _.where('isDeleted', '==', false)
          .where('projectRef.refID', '==', project.id)
          .where('name', '==', id.routineName)
          .where('version', '==', id.version),
      );

      return await DB.genRunQueryOne(query);
    }

    case 'wfname': {
      const project = await genProjectFromName(id.projectName);

      if (!project) {
        return null;
      }

      const query = DB.createQuery(WorkflowModule, (_) =>
        _.where('isDeleted', '==', false)
          .where('projectRef.refID', '==', project.id)
          .where('name', '==', id.routineName),
      );

      return await DB.genRunQueryOne(query);
    }
  }
}

export async function genProjectFromName(
  name: string,
): Promise<Project | null> {
  const query = DB.createQuery(ProjectModule, (_) =>
    _.where('isDeleted', '==', false).where('name', '==', name),
  );
  return await DB.genRunQueryOne(query);
}
