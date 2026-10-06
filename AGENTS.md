<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Centralize reel URL generation and use native device sharing with clipboard fallback, because simulated app pickers cannot enumerate installed apps.
- Use a full-ID public reel route alongside legacy short links, because shared URLs must identify the exact reel without prefix collisions.
- Keep browser video exports at source dimensions with explicit re-encoding disclosure and original-file fallback, because appending an end card requires encoding and browser support varies.
- Store ephemeral social content with an explicit expiry timestamp and filter it in both access rules and reads, because Stories must disappear after 24 hours.
