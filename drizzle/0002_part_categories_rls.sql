-- Custom SQL migration file, put your code below! --
ALTER TABLE part_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_categories FORCE ROW LEVEL SECURITY;

-- Policy that allows all members of the team to SELECT, UPDATE, and DELETE
CREATE POLICY part_categories_access
ON part_categories
USING (api_key_team() = team_id OR user_in_team(team_id));

-- Policy that allows all members of the team to INSERT
CREATE POLICY part_categories_insert
ON part_categories
FOR INSERT
WITH CHECK (api_key_team() = team_id OR user_in_team(team_id));
