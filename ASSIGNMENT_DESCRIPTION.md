**About DealSmart AI**

DealSmart AI is building an AI-powered operating system for automotive dealerships. Our platform helps dealerships manage customer communications, qualify leads, and close more deals using AI agents that work across SMS, email, and voice.

This take-home assesses your ability to build a real feature we might ship: a mini Communications Hub that displays AI-assisted customer conversations.

---

**The Challenge: Build a Communications Hub with CRM Integration**

Build a simplified version of our Communications Hub—a real-time interface where dealership staff can view and manage AI-assisted customer conversations, integrated with HubSpot CRM.

**What You're Building**

A full-stack application with:

1. A React frontend showing a list of conversations and a detail view
2. A Node.js or Python backend with REST/GraphQL API
3. Real-time updates (WebSocket or polling)
4. Integration with an LLM API (Claude or OpenAI) for AI-suggested responses
5. HubSpot CRM integration to pull customer data and sync conversations

---

**Requirements**

**Frontend (React/Next.js)**

- Conversation list with: customer name, last message preview, timestamp, status indicator (new/in-progress/resolved)
- Conversation detail view with: full message thread, clear distinction between customer messages, human agent messages, and AI agent messages
- AI suggestion panel: when viewing a conversation, show an AI-generated suggested response
- Action buttons: "Send as-is", "Edit & Send", "Ignore suggestion"
- Real-time: new messages should appear without page refresh
- Responsive: should work on desktop (mobile is bonus)

**Backend (Node.js or Python)**

- REST or GraphQL API for: listing conversations, getting conversation details, sending messages, generating AI suggestions
- Data persistence: PostgreSQL, SQLite, or even JSON files—your choice
- LLM integration: call Claude or OpenAI API to generate response suggestions
- WebSocket or SSE for real-time message updates

**AI Integration**

When a user views a conversation, your app should:

1. Send the conversation context to an LLM (Claude or GPT)
2. Generate a suggested response that sounds like a helpful dealership sales advisor
3. Display the suggestion in the UI

Your prompt should instruct the AI to:

- Be helpful and professional
- Reference specific details from the conversation
- Avoid making up information (e.g., don't invent prices or inventory)

---

**HubSpot CRM Integration (Critical)**

This is a core part of the assessment. We want to see how you work with third-party APIs.

**Setup (before you start coding):**

- Create a free HubSpot developer account at [developers.hubspot.com](http://developers.hubspot.com/)
- Create a test app and get your API credentials
- Populate your HubSpot with 5–10 test contacts (name, email, phone, notes)

**Required Integration:**

- Pull contacts from HubSpot to populate your conversation list
- When viewing a conversation, display the customer's HubSpot profile data (name, email, phone, any custom properties)
- When sending a message, log it as an activity/note on the HubSpot contact
- Handle OAuth or API key authentication properly (don't hardcode credentials)

**What We're Evaluating:**

- Can you read API documentation and implement an integration?
- How do you handle auth tokens and credentials securely?
- What happens when the CRM API is slow or returns errors?
- Do you cache data appropriately to avoid hammering the API?

_Note: We will test your app against our own HubSpot instance, so make sure the integration is configurable (environment variables, not hardcoded to your account)._

---

**Seed Data**

Use this sample data (or create your own):

**Conversation 1: Sarah Chen**

**Customer:** "Hi, I saw your ad for the 2024 BMW X5. Is it still available?" **AI Agent (Max):** "Hi Sarah\! Yes, we have the 2024 X5 in stock. Are you interested in the xDrive40i or the M50?" **Customer:** "The M50. What colors do you have?"

**Conversation 2: Mike Rodriguez**

**Customer:** "I need to schedule service for my 330i. Check engine light came on." **AI Agent (Max):** "I'm sorry to hear that, Mike. I can help you schedule a diagnostic. What days work best for you this week?"

**Conversation 3: Jennifer Walsh**

**Customer:** "What's your best price on the X3? I'm also looking at the Audi Q5."
