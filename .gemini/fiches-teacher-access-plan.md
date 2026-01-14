# Fiches Pédagogiques - Teacher Access Control Implementation Plan

## Overview
Implement a comprehensive access control system for Fiches Pédagogiques with role-based visibility and ownership.

## Requirements Summary

### 1. User Roles & Registration
- Add "Professeur" checkbox to registration form
- Map "Professeur" → TEACHER role, "Étudiant" → STUDENT role
- Only TEACHER, EDITOR, and ADMIN can access Fiches Pédagogiques section

### 2. Fiche Visibility Rules
**Teachers see:**
- All fiches where `isPublic = true` (published by admin)
- Their own fiches (`userId = currentUser.id`)

**Admins/Editors see:**
- All fiches (no restrictions)

**Students:**
- No access to Fiches Pédagogiques section at all

### 3. Fiche Ownership & Editing
**Teachers can:**
- Create their own fiches
- Edit their own fiches
- Download their own fiches
- View (but not edit) admin-published fiches

**When a teacher edits their own fiche:**
- Update happens in-place (normal update)

**When an admin edits a teacher's fiche:**
- Create a copy with `isPublic = true`
- Original fiche stays with the teacher (unchanged)
- This creates a "published version" separate from the teacher's original

**When a teacher edits an admin-published fiche:**
- Create a personal copy for the teacher
- Admin's published version stays unchanged

## Implementation Steps

### Step 1: Update Registration Form
**File:** `src/app/(auth)/register/page.tsx` (or wherever registration is)

- Add radio buttons or checkbox for "Étudiant" / "Professeur"
- Default to STUDENT
- Map selection to UserRole enum

### Step 2: Add Access Control Middleware
**File:** `src/middleware.ts` or route-level checks

- Restrict `/teacher/fiches` and `/fiches` routes to TEACHER, EDITOR, ADMIN roles only
- Redirect STUDENT users to home or show error

### Step 3: Update Fiche Actions
**File:** `src/actions/fiches.ts`

**Update `getUserFiches`:**
```typescript
// For TEACHER: return own fiches + public fiches
// For ADMIN/EDITOR: return all fiches
```

**Add `createFicheCopy` action:**
```typescript
// When admin edits teacher fiche or teacher edits admin fiche
// Create a new fiche with copied data
```

**Update `updateFiche`:**
```typescript
// Check ownership
// If admin editing teacher fiche → create copy
// If teacher editing admin fiche → create copy
// Otherwise → update in place
```

### Step 4: Update Fiches List UI
**File:** `src/components/fiches/fiches-list.tsx`

- Show "Create Fiche" button for TEACHER, EDITOR, ADMIN
- Add visual indicator for:
  - Own fiches (editable)
  - Public fiches (view/download only for teachers)
  - All fiches (for admins)

### Step 5: Update Fiche Builder/Editor
**File:** `src/components/fiches/fiche-builder.tsx`

- Check if user can edit (owner or admin)
- If teacher editing admin fiche → show "Create Personal Copy" instead of "Save"
- If admin editing teacher fiche → show "Publish Copy" instead of "Save"

### Step 6: Schema Changes (if needed)
**File:** `prisma/schema.prisma`

Consider adding:
```prisma
model PedagogicalSheet {
  // ... existing fields
  originalFicheId String? // If this is a copy, reference to original
  isAdminCopy     Boolean @default(false) // True if admin published a teacher's fiche
}
```

This helps track the relationship between originals and copies.

### Step 7: Update Navigation
**File:** `src/components/header.tsx` or navigation component

- Show "Fiches Pédagogiques" link only for TEACHER, EDITOR, ADMIN
- Hide from STUDENT users

## Database Migration Strategy

1. Run `npx prisma migrate dev --name add-fiche-copy-tracking` if schema changes
2. Or run `npx prisma db push` for development

## Testing Checklist

- [ ] Student cannot access Fiches Pédagogiques
- [ ] Teacher can create fiche
- [ ] Teacher can edit own fiche
- [ ] Teacher can see admin-published fiches
- [ ] Teacher cannot see other teachers' fiches
- [ ] Admin can see all fiches
- [ ] Admin editing teacher fiche creates copy
- [ ] Teacher editing admin fiche creates copy
- [ ] Original fiches remain unchanged when copied

## Priority Order

1. **High Priority:**
   - Registration form update (role selection)
   - Access control (route protection)
   - Visibility filtering in `getUserFiches`

2. **Medium Priority:**
   - Copy-on-edit logic
   - UI indicators for ownership

3. **Low Priority:**
   - Schema enhancements for tracking copies
   - Advanced features

## Notes

- The current `isPublic` field can be used for admin-published fiches
- `userId` already tracks ownership
- Need to decide: Should we track copy relationships in DB or just create independent copies?
