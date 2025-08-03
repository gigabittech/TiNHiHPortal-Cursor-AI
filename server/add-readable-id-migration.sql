-- Add readable_id column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS readable_id TEXT;

-- Update existing appointments with readable IDs
UPDATE appointments 
SET readable_id = substring(md5(random()::text), 1, 8)
WHERE readable_id IS NULL;

-- Make the column NOT NULL and UNIQUE
ALTER TABLE appointments ALTER COLUMN readable_id SET NOT NULL;
ALTER TABLE appointments ADD CONSTRAINT appointments_readable_id_unique UNIQUE (readable_id);

-- Add default value for future appointments
ALTER TABLE appointments ALTER COLUMN readable_id SET DEFAULT substring(md5(random()::text), 1, 8); 