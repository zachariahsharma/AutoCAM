-- Custom SQL migration file, put your code below! --
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY parts_access
ON parts
USING (
  EXISTS (
    SELECT 1
    FROM part_categories pc
    WHERE pc.id = category_id
      AND is_in_team(pc.team_id)
  )
);

CREATE POLICY parts_insert
ON parts
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM part_categories pc
    WHERE pc.id = category_id
      AND is_in_team(pc.team_id)
  )
);