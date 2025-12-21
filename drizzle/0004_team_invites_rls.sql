-- Custom SQL migration file, put your code below! --
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites FORCE ROW LEVEL SECURITY;

-- Allow team invites to be seen by everyone on the team and API keys
CREATE POLICY team_invites_query
ON team_invites
FOR SELECT
USING (api_key_team() = team_id OR user_in_team(team_id));

-- Allow team invites to be created by admins only and API keys
CREATE POLICY team_invites_insert
ON team_invites
FOR INSERT
WITH CHECK (api_key_team() = team_id OR user_is_team_admin(team_id));

-- Allow team invites to be deleted by admins only and API keys
CREATE POLICY team_invites_delete
ON team_invites
FOR DELETE
USING (api_key_team() = team_id OR user_is_team_admin(team_id));

-- Don't allow modifying invites
CREATE POLICY team_invites_update
ON team_invites
FOR UPDATE
USING (false);