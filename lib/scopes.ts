import zod from "zod";

const scopes = {
  teams: {
    read: "team:read",
    invites: {
      read: "teams:invites:read",
      send: "teams:invites:send",
      cancel: "teams:invites:cancel"
    },
  },
  materials: {
    read: "materials:read",
    write: "materials:write",
  },
  machines: {
    read: "materials:read",
    write: "materials:write",
  },
  tools: {
    read: "materials:read",
    write: "materials:write",
  },
  pc: {
    read: "part_categories:read",
    write: "part_categories:write",
    assignments: {
      read: "part_categories:assignments:read",
      write: "part_categories:assignments:write"
    }
  },
  parts: {
    read: "parts:read",
    write: "parts:write"
  },
  plates: {
    read: "plates:read",
    write: "plates:write",
    jobs: {
      read: "plates:jobs:read",
      write: "plates:jobs:write"
    }
  },
  boxTubes: {
    read: "box_tubes:read",
    write: "box_tubes:write",
    jobs: {
      read: "box_tubes:jobs:read",
      write: "box_tubes:jobs:write"
    }
  },
};
export default scopes;

function getValues(obj: Record<string, unknown>) {
  let result: string[] = [];
  for (const key in obj) {
    if (typeof obj[key] === "string")
      result.push(obj[key]);
    else
      result = result.concat(getValues(obj[key] as Record<string, unknown>))
  }
  return result;
}

export const ScopeEnum = zod.enum(getValues(scopes));