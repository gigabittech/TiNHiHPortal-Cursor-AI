-- Add reset token fields to users table
ALTER TABLE users 
ADD COLUMN reset_token TEXT,
ADD COLUMN reset_token_expiry TIMESTAMP; 