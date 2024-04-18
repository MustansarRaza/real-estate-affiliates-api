import { TaskType } from "affiliates-api/models";

class TaskTypesService {
  /**
   * {@returns} a mapping that contains all task types available
   * against a task. task_type_id as a key and task type data
   * associated with the id as value.
   */
  async getMappings(): Promise<Record<number, TaskType>> {
    const taskTypes = await TaskType.findAll({
      attributes: ["id", "title", "parentID"],
      raw: true,
    });

    const taskTypesMapping: Record<number, TaskType> = {};

    taskTypes.forEach((type: TaskType) => {
      taskTypesMapping[type.id] = type;
    });

    return taskTypesMapping;
  }

  /**
   *
   * @param typeId
   * @param mappings for available task types
   * @returns the ultimate parent of the given task type id
   */
  getRootParent(typeId: number, mappings: Record<number, TaskType>): TaskType {
    let parentTaskType = mappings[typeId];
    while (parentTaskType.parentID) parentTaskType = mappings[parentTaskType.parentID];

    return parentTaskType;
  }
}

export default TaskTypesService;
