-- Custom SQL migration file, put your code below! --
ALTER TABLE team_runners ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_runners FORCE ROW LEVEL SECURITY;

-- Policy that allows only people from this team to SELECT runners
CREATE POLICY runners_query
ON team_runners
FOR SELECT
USING (is_in_team(team_id));

-- Policy that allows only admins to DELETE a runner
CREATE POLICY runners_delete
ON team_runners
FOR DELETE
USING (is_team_admin(team_id));

-- Policy that allows only admins to UPDATE a runner
CREATE POLICY runners_update
ON team_runners
FOR UPDATE
USING (is_team_admin(team_id));

-- Policy that allows only admins to INSERT a runner
CREATE POLICY runners_insert
ON team_runners
FOR INSERT
WITH CHECK (is_team_admin(team_id));