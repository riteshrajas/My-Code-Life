-- Fix RLS policy for family_members table to allow registration
-- This adds the missing INSERT policy that allows new family members to register

-- Add insert policy for family_members table
CREATE POLICY "Anyone can register as a family member"
ON public.family_members
FOR INSERT
WITH CHECK (true);

-- Verify the policy was created successfully
-- You can run this query to check: SELECT * FROM pg_policies WHERE tablename = 'family_members';
