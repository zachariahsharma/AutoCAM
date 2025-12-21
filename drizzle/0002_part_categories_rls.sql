-- Custom SQL migration file, put your code below! --
ALTER TABLE part_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_categories FORCE ROW LEVEL SECURITY;

-- Policy that allows all members of the team to SELECT, UPDATE, and DELETE
CREATE POLICY part_categories_access
ON part_categories
USING (is_in_team(team_id));

-- Policy that allows all members of the team to INSERT
CREATE POLICY part_categories_insert
ON part_categories
FOR INSERT
WITH CHECK (is_in_team(team_id));
