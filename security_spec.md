# Security Specification for Heartland NGO Portal

## 1. Data Invariants
- About info must have valid email and phone format if provided.
- Projects/Events must have titles and valid statuses.
- Volunteer applications must have an email.
- Admins are defined in the `/admins/{userId}` collection.

## 2. The Dirty Dozen Payloads (Targeting PERMISSION_DENIED)

1. **Unauthorized Update to About**: Non-admin attempting to change the mission.
2. **Shadow Field injection**: Adding `isAdmin: true` to a volunteer application.
3. **Owner Spoofing**: Setting `founderName` as someone else without admin rights.
4. **Large Payload**: Sending 1MB string in a project description.
5. **ID Poisoning**: Using a 2KB long string as a document ID for an event.
6. **Volunteer Status Escalation**: A volunteer attempting to set their own status to 'Approved'.
7. **Pii Leak**: Non-admin attempting to list all volunteer emails.
8. **Invalid Enum**: Setting project status to 'Deleted' (not in enum).
9. **Timestamp Spoofing**: Setting `createdAt` to a future date instead of `request.time`.
10. **Admin Self-Promotion**: User creating a document in `/admins/` for themselves.
11. **Gallery Hotlinking**: Creating a gallery item with a script tag as the URL.
12. **Survey Manipulation**: Updating another person's survey response.

## 3. Test Runner (firestore.rules.test.ts)
I will implement this after the initial rules draft.
