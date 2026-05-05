# Notification UI — Design Spec

**Date:** 2026-05-05
**Status:** Approved

---

## Context

The Cradlen dashboard navbar already has a static bell icon with a hardcoded badge (`src/components/common/Navbar.tsx`). This spec defines the full notification UI — the bell badge, dropdown panel, and a dedicated notifications page — ready to wire up to backend APIs when they are available. No backend integration is included in this scope; all data access is abstracted behind a hook interface.

---

## Decisions Made

| Question | Decision |
|---|---|
| Panel style | Dropdown anchored to bell icon |
| Badge style | Number count, brand green (`#11604C`), capped at `99+` |
| Notification categories | Appointments, Staff, Medicine, Patients, Reports, System |
| Click behavior | Row click navigates to related page and marks as read |
| Surfaces | Dropdown panel (latest 6) + full notifications page (paginated) |

---

## Surface 1 — Bell Icon & Badge

**Location:** `src/components/common/Navbar.tsx`, in the `navbar-right` icon group.

Replace the current static `badge` boolean prop on `<IconButton>` with a dynamic count driven by `useNotifications()`.

**Badge rules:**
- No badge when `unreadCount === 0`
- Show number when `1 ≤ unreadCount ≤ 99`
- Show `99+` when `unreadCount > 99`
- Brand green background (`bg-brand-primary`), white text, white ring border
- Bell button gets an `active` ring style when the dropdown is open

---

## Surface 2 — Dropdown Panel

**Component:** `src/features/notifications/components/NotificationDropdown.tsx`

Rendered as a Radix `Popover` anchored to the bell button. Closes on outside click or `Escape`.

### Header
- Title: "Notifications" + grey unread count label (`5 unread`)
- "Mark all as read" button — right-aligned, brand green text

### Notification list
- Shows latest **6** notifications ordered by `created_at` descending
- Each item:
  - Category icon in a rounded square (color-coded per category — see table below)
  - **Title** (bold, 12px) — truncated to one line
  - **Description** (muted, 11px) — max two lines
  - **Relative time** (`2 min ago`, `Yesterday`)
  - Green unread dot on the right when `is_read === false`
  - Entire row is clickable → navigates to related route, marks item as read

### Category icon colors

| Category | Icon | Background |
|---|---|---|
| Appointments | 📅 | `bg-emerald-100` |
| Staff | 👥 | `bg-violet-100` |
| Medicine | 💊 | `bg-yellow-100` |
| Patients | 🧑‍⚕️ | `bg-blue-100` |
| Reports | 📊 | `bg-orange-100` |
| System | ⚙️ | `bg-gray-100` |

### Loading state
Render 4 skeleton rows (animated shimmer) while the query is in `pending` state.

### Empty state
Bell icon + "You're all caught up" heading + "No new notifications right now. Check back later." subtext.

### Footer
"View all notifications →" link — navigates to the full notifications page.

---

## Surface 3 — Full Notifications Page

**Route:** `/[locale]/[orgId]/[branchId]/notifications`
**Component:** `src/app/[locale]/[orgId]/[branchId]/notifications/page.tsx`
**Feature module:** `src/features/notifications/`

### Page header
- Title: "Notifications"
- Subtitle: "Showing X–Y of Z notifications"
- "Mark all as read" button (outline style)

### Filter bar
Horizontal scrollable chip row. Chips: **All**, **Appointments**, **Staff**, **Medicine**, **Patients**, **Reports**, **System**. Active chip uses brand green fill + border. Selecting a chip filters the list client-side (or via query param for deep-linking).

### Notification rows (full width)
Each row:
- Larger icon square (40×40px)
- Full title (not truncated)
- Full description (up to 3 lines)
- Absolute timestamp (`Yesterday, 4:00 PM`)
- Right column: unread dot (if unread) + type badge pill

### Type badge colors (match dropdown icon colors)

| Category | Badge class |
|---|---|
| Appointments | green text on green-100 bg |
| Staff | violet text on violet-100 bg |
| Medicine | amber text on yellow-100 bg |
| Patients | blue text on blue-100 bg |
| Reports | orange text on orange-100 bg |
| System | gray text on gray-100 bg |

### Pagination
- 10 items per page
- Previous / page numbers / Next controls
- "Showing X–Y of Z" label

---

## Data & Hook Interface

All components consume `useNotifications()` from `src/features/notifications/hooks/useNotifications.ts`. The hook is a **stub** initially — it returns mock data — and will be swapped for real TanStack Query calls when the backend API is ready.

```ts
// src/features/notifications/types/notification.types.ts
export type NotificationCategory =
  | 'appointment' | 'staff' | 'medicine' | 'patient' | 'report' | 'system';

export type Notification = {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  is_read: boolean;
  navigate_to?: string;   // route to push on click (optional)
  created_at: string;     // ISO 8601
};

// useNotifications() return shape
export type UseNotificationsReturn = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};
```

Navigation on click uses `useRouter` from `@/i18n/navigation` (locale-aware).

---

## Feature Module Structure

```
src/features/notifications/
  components/
    NotificationDropdown.tsx   ← dropdown panel
    NotificationItem.tsx       ← shared row component (used by both surfaces)
    NotificationBadge.tsx      ← badge number display logic
  hooks/
    useNotifications.ts        ← stub hook (mock data initially)
  types/
    notification.types.ts
```

---

## i18n

Add keys to `src/messages/en.json` and `src/messages/ar.json`:

```json
"Notifications": {
  "title": "Notifications",
  "markAllRead": "Mark all as read",
  "unreadCount": "{count} unread",
  "viewAll": "View all notifications",
  "allCaughtUp": "You're all caught up",
  "allCaughtUpSub": "No new notifications right now. Check back later.",
  "categories": {
    "all": "All",
    "appointment": "Appointments",
    "staff": "Staff",
    "medicine": "Medicine",
    "patient": "Patients",
    "report": "Reports",
    "system": "System"
  }
}
```

---

## Out of Scope

- Real-time push / WebSocket updates (future)
- Per-notification dismiss / delete action
- Notification preferences / settings page
- Backend API calls (hook is stubbed; wired up in a follow-on task)

---

## Verification

1. `npm run lint` — no errors
2. `npm run build` — no type or build errors
3. **Bell badge:** visit dashboard, confirm badge shows count and disappears when `unreadCount === 0`
4. **Dropdown:** click bell → panel opens; click outside → closes; click item → navigates and dot disappears
5. **Mark all:** click "Mark all as read" → all dots clear, badge resets to 0
6. **View all:** click footer link → lands on `/notifications` page
7. **Filter chips:** clicking a category chip filters the list to that category only
8. **RTL:** switch to Arabic locale, confirm layout mirrors correctly
9. **Loading skeleton:** verify shimmer rows appear before data resolves
10. **Empty state:** verify bell + copy render when list is empty
