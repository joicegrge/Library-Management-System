-- Preserve loan history while allowing members with no active loans to be removed
-- from the visible member directory.
ALTER TABLE members
  ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0 AFTER membership_type,
  ADD KEY idx_members_is_deleted (is_deleted);
