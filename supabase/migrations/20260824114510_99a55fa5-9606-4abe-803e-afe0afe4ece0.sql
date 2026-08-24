revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_like_count() from public, anon, authenticated;
revoke all on function public.sync_comment_count() from public, anon, authenticated;
revoke all on function public.sync_post_rating() from public, anon, authenticated;
revoke all on function public.sync_report_count() from public, anon, authenticated;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;