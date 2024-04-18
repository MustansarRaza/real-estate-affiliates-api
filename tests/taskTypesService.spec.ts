import { TaskTypesService } from "affiliates-api/services";
import { loadSequelizeFixtures } from "./support";
import { ModelFixtureNames } from "./support/data";
describe("TaskTypeService", () => {
  const service = new TaskTypesService();

  beforeEach(async () => {
    await loadSequelizeFixtures(ModelFixtureNames.TASK_TYPES);
  });

  it("should return all available task type mappings", async () => {
    const taskTypesMapping = await service.getMappings();
    expect(taskTypesMapping).toBeTruthy();
    expect(typeof taskTypesMapping).toBe("object");
    expect(Object.keys(taskTypesMapping).length).toBeGreaterThan(0);
  });

  [
    {
      taskType: {
        id: 35,
        title: "Follow Up (Call)",
      },
      rootParent: {
        id: 54,
        title: "Calls",
      },
    },
    {
      taskType: {
        id: 46,
        title: "Company Office",
      },
      rootParent: {
        id: 53,
        title: "Meetings",
      },
    },
  ].forEach(({ taskType, rootParent }) => {
    it(`should return the ultimate parent task type of '${taskType.title}' `, async () => {
      const taskTypesMapping = await service.getMappings();
      const response = service.getRootParent(taskType.id, taskTypesMapping);

      expect(response.id).toBe(rootParent.id);
      expect(response.title).toBe(rootParent.title);
    });
  });
});
