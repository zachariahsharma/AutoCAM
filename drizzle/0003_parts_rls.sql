-- Custom SQL migration file, put your code below! --
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY parts_access
ON parts
USING (can_access_category(category_id));

CREATE POLICY parts_insert
ON parts
FOR INSERT
WITH CHECK (can_access_category(category_id));