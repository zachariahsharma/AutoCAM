export default {
  teams: {
    read: "team:read",
    invites: {
      read: "teams:invites:read",
      send: "teams:invites:send",
      cancel: "teams:invites:cancel"
    }
  },
  pc: {
    read: "part_categories:read",
    write: "part_categories:write"
  },
  parts: {
    read: "parts:read",
    write: "parts:write"
  },
  plates: {
    read: "plates:read",
    write: "plates:write"
  }
};