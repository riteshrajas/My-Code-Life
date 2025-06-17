-- Add family access columns to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS family_access_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_family_access ON public.contacts(family_access_enabled);
CREATE INDEX IF NOT EXISTS idx_contacts_family_member ON public.contacts(family_member_id);

-- Update any existing contacts to have family access disabled by default
UPDATE public.contacts 
SET family_access_enabled = FALSE 
WHERE family_access_enabled IS NULL;
