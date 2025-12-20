-- Custom SQL migration file, put your code below! --
ALTER TABLE part_categories ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION can_access_category(category_id INTEGER) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM part_categories pc
    WHERE id = category_id
      AND is_in_team(team_id)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Policy that allows all members of the team to SELECT, UPDATE, and DELETE
CREATE POLICY part_categories_access
ON part_categories
USING (is_in_team(team_id));

-- Policy that allows all members of the team to INSERT
CREATE POLICY part_categories_insert
ON part_categories
FOR INSERT
WITH CHECK (is_in_team(team_id));
