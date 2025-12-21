-- Custom SQL migration file, put your code below! --
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts FORCE ROW LEVEL SECURITY;

-- Policy to ensure that any member or API key from the team can SELECT, DELETE, or UPDATE parts
CREATE POLICY parts_access
ON parts
USING (
  EXISTS (
    SELECT 1
    FROM part_categories pc
    WHERE pc.id = parts.category_id
      AND (api_key_team() = pc.team_id OR user_in_team(pc.team_id))
  )
);

-- Policy to ensure that any member or API key from the team can INSERT parts
CREATE POLICY parts_insert
ON parts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM part_categories pc
    WHERE pc.id = parts.category_id
      AND (api_key_team() = pc.team_id OR user_in_team(pc.team_id))
  )
);