ALTER TABLE "AdminInvitation" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "AdminInvitation" FROM anon, authenticated;
