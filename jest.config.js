module.exports = {
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      compiler: "ttypescript",
    },
  },
  maxWorkers: 2,
  setupFilesAfterEnv: ["./tests/setup.ts"],
  collectCoverageFrom: ["src/{!(index),}.ts", "src/**/{!(index),}.ts"],
};
