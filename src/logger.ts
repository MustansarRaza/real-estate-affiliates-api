import { createLogger } from "bunyan";

const logger = createLogger({
  name: "affiliates-api",
  streams: [{ level: "info", stream: process.stdout }],
});

export default logger;
