-- Allow users to create their own profile row (traditional flow)
-- Required because profiles.email is NOT NULL and the client needs to insert/upsert.

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
