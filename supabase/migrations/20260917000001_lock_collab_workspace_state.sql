create policy collab_workspace_state_server_only
  on public.collab_workspace_state
  for all
  to anon, authenticated
  using (false)
  with check (false);
