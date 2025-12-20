-- Custom SQL migration file, put your code below! --
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_in_team(tid INTEGER) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = tid
      AND user_id = current_setting('app.user_id')
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION is_team_admin(tid INTEGER) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = tid
      AND admin = true
      AND user_id = current_setting('app.user_id')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Policy that allows all users to SELECT teams they are a part of
CREATE POLICY teams_query
ON teams
FOR SELECT
USING (is_in_team(id) OR created_by = current_setting('app.user_id'));

-- Policy that allows users that are admin to DELETE teams they are a part of
CREATE POLICY teams_delete
ON teams
FOR DELETE
USING (is_team_admin(id));

-- Policy that allows users that are admin to UPDATE the teams they are a part of
CREATE POLICY teams_update
ON teams
FOR UPDATE
USING (is_team_admin(id));
