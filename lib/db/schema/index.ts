import * as camSchemas from "./cam";
import * as authSchemas from "./auth";
import * as entitiesSchemas from "./entities";

export default {
  ...camSchemas,
  ...authSchemas,
  ...entitiesSchemas
}