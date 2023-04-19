# Push notification management API

Simple push notification manager I can implement in my apps. Yay.

---

### Endpoints

Be sure to use a topic others won't guess.

-   GET `/get-public-vapid-key` returns `{data: "KEY"}`
-   POST `/subscribe` returns `{status: 200}` if done right. Provide a JSON body with the following: `{topic: "my-topic-name", subscription: {JS subscription object, see frontend/index.html}}`

-   GET `/send-notification` with query params `topic: string`, `title: string`, `body: string`, and optionally `at: ISO date string`
-   GET `/get-notifications` with query params `topic: string` returns all push notifications
-   GET `/remove-notification/` with query param `id: string` (ID of the notification)
