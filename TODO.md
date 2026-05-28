# Roadmap: Modern Communication Platform Upgrade

## Slice 1 — Status / Stories (WhatsApp-style)
- [ ] Backend: add `Status` model with expiry (24h), privacy, and reply support
- [ ] Backend: add status controllers + routes (upload, create, list, view)
- [ ] Backend: add status seen tracking (per viewer) + socket events `status:*`
- [ ] Backend: handle media storage via existing `/uploads` pipeline
- [ ] Frontend: add `StatusBar` horizontal UI + story viewer modal with progress bars
- [ ] Frontend: add status upload composer (image/video/text) + privacy settings UI
- [ ] Frontend: add reply + emoji reactions UI to status items
- [ ] Frontend: implement status privacy enforcement on list/view
- [ ] Frontend: integrate socket subscriptions for live seen/reaction updates
- [ ] Stabilize: ensure existing private chat (1:1) remains unaffected

## Slice 2 — Group Chats (Telegram/Discord-style)
- [ ] Backend: extend conversation model into `conversationType` (`private|group`) OR add `Group` model
- [ ] Backend: group membership/admin roles + group settings (avatar/banner/description)
- [ ] Backend: add group message support + routes for group threads and pinned messages
- [ ] Backend: add socket events `group:*` (message, seen, reactions, typing)
- [ ] Frontend: group sidebar/list and group header (settings/admin/leave)
- [ ] Frontend: generalize message components to support group context
- [ ] Frontend: implement mentions `@username` in groups
- [ ] Stabilize: pin/unpin, delete group, notifications, and leave group

## Slice 3 — Meeting / Rooms (Google Meet/Discord-style)
- [ ] Backend: create room model (private/group/temporary), invite token handling
- [ ] Backend: socket room management + participant tracking
- [ ] Backend: signaling events `meeting:*` mapped to WebRTC
- [ ] Frontend: Meeting layout + participant grid + floating controls
- [ ] Frontend: implement `useMeetingRTC` hook (tracks, mute/cam/screen share)
- [ ] Frontend: meeting chat panel (group message inside room)
- [ ] Stabilize: smooth animations, responsive behavior, leaving/ending meeting

## Refactor / Architecture Hardening (ongoing)
- [ ] Introduce reusable socket subscription hooks
- [ ] Introduce reusable modal system for status viewer, meeting UI, group settings
- [ ] Ensure modular folder layout for new features
- [ ] Add lightweight state management patterns to avoid prop drilling
- [ ] Optimize rendering (memoization, virtualized lists if needed)

## Completion Criteria
- [ ] Existing authentication and 1:1 messaging remain stable
- [ ] New features ship as modular slices with consistent event contracts
- [ ] No “messy” one-off changes that couple domains together

