# FamousVibe Reels & Stories rebuild

## What will change
- Use the uploaded FamousVibe logo in the top branding, sign-in experience, and installable app icons.
- Add a horizontal Stories tray above Home, a story upload flow, and a full-screen 9:16 viewer with progress bars, tap navigation, and automatic advance.
- Store Stories in Lovable Cloud with owner-only creation/deletion, public viewing, and automatic exclusion after 24 hours.
- Keep Reels as a full-screen snap feed with one active video, immediate pause when leaving view, sound requested by default, and double-tap likes.
- Make the right-side controls match the requested order: Like, Comment, Share, Save, Rating, and More.
- Open the device share sheet directly from Share when available, with copy-link fallback on desktop.
- Limit the More sheet to Not Interested, Report, Copy Link, and Download Video.
- Preserve uploaded video quality and produce downloads at the source dimensions with audio plus a 3-second FamousVibe and creator end card when the browser supports recording.
- Keep likes, comments, ratings, follows, saves, reports, and Stories connected to the existing backend.

## Technical details
- Add a `stories` table with explicit grants, row-level access rules, expiry validation, and an expiry index; reuse private media storage and signed URLs.
- Add typed story reads/writes through authenticated and optional-auth server functions.
- Build focused Story tray/viewer/upload components and integrate them into Home without replacing the existing Reels card system.
- Process downloads in-browser using the original media dimensions; combine canvas video with the source audio track and append a timed end card. Unsupported browsers will download the original file and clearly notify the user.
- Update metadata and verify the central flow in the running preview at mobile and desktop sizes.

## Important browser behavior
Modern browsers can block autoplay with sound until the first user interaction. FamousVibe will always request unmuted playback and will not show a mute control, but the browser may require the first tap before sound begins.
