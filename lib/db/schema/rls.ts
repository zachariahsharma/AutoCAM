import { and, eq, getTableName, SQL, sql } from "drizzle-orm"
import { TeamKeys, TeamMembers } from "./entities"
import { BoxTubeJobs, BoxTubes, Jobs, Machines, Materials, PartCategories, Parts, PartsToPlates, PlateJobs, Plates, ToolMachines, ToolMaterials, Tools } from "./cam"

export function UserId() {
  return sql`current_setting('app.user_id', true)`
}

export function KeyDigest() {
  return sql`current_setting('app.key_digest', true)`
}

export function UserInTeam(tid: any): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1 FROM ${sql.identifier(getTableName(TeamMembers))}
    WHERE ${and(eq(TeamMembers.team_id, tid), eq(TeamMembers.user_id, UserId()))}
  )
  `
}

export function UserIsTeamAdmin(tid: any): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1 FROM ${sql.identifier(getTableName(TeamMembers))}
    WHERE ${and(eq(TeamMembers.team_id, tid), eq(TeamMembers.admin, sql`true`), eq(TeamMembers.user_id, UserId()))}
  )
  `
}

export function KeyAuthorized(teamId: any, scope: string): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1
    FROM ${sql.identifier(getTableName(TeamKeys))}
    WHERE ${and(eq(TeamKeys.digest, KeyDigest()), eq(TeamKeys.team_id, teamId), eq(sql.raw(`'${scope}'`), sql`ANY(${TeamKeys.scopes})`))}
  )
  `
}

export function TeamFromCategory(cid: any) {
  return sql`
  (
    SELECT ${PartCategories.team_id}
    FROM ${sql.identifier(getTableName(PartCategories))}
    WHERE ${eq(PartCategories.id, cid)}
  )
  `
}

export function TeamFromTool(tid: any) {
  return sql`
  (
    SELECT ${Tools.team_id}
    FROM ${sql.identifier(getTableName(Tools))}
    WHERE ${eq(Tools.id, tid)}
  )
  `
}

export function TeamFromPlate(pid: any) {
  return sql`
  (
    SELECT ${TeamFromCategory(Plates.category_id)}
    FROM ${sql.identifier(getTableName(Plates))}
    WHERE ${eq(Plates.id, pid)}
  )
  `
}

export function TeamFromBoxTube(bid: any) {
  return sql`
  (
    SELECT ${BoxTubes.team_id}
    FROM ${sql.identifier(getTableName(BoxTubes))}
    WHERE ${eq(BoxTubes.id, bid)}
  )
  `
}

export function CheckPartsPlatesTeam(): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1 FROM ${Plates}
    INNER JOIN ${Parts} ON ${eq(Parts.id, PartsToPlates.part_id)}
    WHERE ${and(eq(Plates.id, PartsToPlates.plate_id), eq(Plates.category_id, Parts.category_id))}
  )
  `
}

export function CheckToolMaterialsTeam(): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1 FROM ${Tools}
    INNER JOIN ${Materials} ON ${eq(Materials.id, ToolMaterials.material_id)}
    WHERE ${and(eq(Tools.id, ToolMaterials.tool_id), eq(Tools.team_id, Materials.team_id))}
  )
  `
}

export function CheckToolMachinesTeam(): SQL<boolean> {
  return sql`
  EXISTS (
    SELECT 1 FROM ${Tools}
    INNER JOIN ${Machines} ON ${eq(Machines.id, ToolMachines.machine_id)}
    WHERE ${and(eq(Tools.id, ToolMachines.tool_id), eq(Tools.team_id, Machines.team_id))}
  )
  `
}
