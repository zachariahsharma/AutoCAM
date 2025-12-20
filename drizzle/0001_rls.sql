-- Custom SQL migration file, put your code below! --
ALTER TABLE part_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY part_category_team_access
ON part_categories
USING (
  EXISTS (
    SELECT 1
    FROM team_members tm
    WHERE tm.team_id = part_categories.team_id
      AND tm.user_id = current_setting('app.user_id', true)
  )
);