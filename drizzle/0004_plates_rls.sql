-- Custom SQL migration file, put your code below! --
ALTER TABLE plates ENABLE ROW LEVEL SECURITY;

CREATE POLICY plates_access
ON plates
USING (
  EXISTS (
    SELECT 1
    FROM part_categories pc
    WHERE pc.id = category_id
      AND is_in_team(pc.team_id)
  )
);

CREATE POLICY plates_insert
ON plates
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM part_categories pc
    WHERE pc.id = category_id
      AND is_in_team(pc.team_id)
  )
);