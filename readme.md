# Push notification management API

Simple push notification manager I can implement in my apps. Yay.

---

### Endpoints

-   GET `/get-public-vapid-key` returns `{data: "KEY"}`
-   GET `/send-notification` with query params `topic: string`, `title: string`, `body: string`
-   POST `/subscribe` returns `{status: 200}` if done right. Provide a JSON body with the following: `{topic: "my-topic-name", subscription: {JS subscription object, see frontend/index.html}}`
