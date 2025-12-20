-- Custom SQL migration file, put your code below! --
ALTER TABLE plates ENABLE ROW LEVEL SECURITY;

CREATE POLICY plates_access
ON plates
USING (can_access_category(category_id));

CREATE POLICY plates_insert
ON plates
FOR INSERT
WITH CHECK (can_access_category(category_id));