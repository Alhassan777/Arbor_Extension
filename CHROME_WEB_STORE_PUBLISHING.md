# Chrome Web Store Publishing Information

## Arbor - Chat Tree Navigator

---

## 1. SINGLE PURPOSE DESCRIPTION

**Single Purpose**: Organize and manage ChatGPT conversations in hierarchical tree structures for easy navigation and relationship tracking.

Arbor provides a single, focused purpose: allowing users to organize their ChatGPT conversations into navigable tree structures. Users can create branches from existing conversations, visualize relationships through interactive graphs, and seamlessly navigate between related chats. All data is stored locally on the user's device. The extension optionally uses AI-powered context generation (via user's own Gemini API key) to summarize conversations when creating branches. This single purpose of conversation organization and navigation is narrow, well-defined, and easy to understand.

---

## 2. PERMISSION JUSTIFICATIONS

### Storage Justification

The `storage` permission is essential for Arbor's core functionality. The extension stores conversation trees, chat metadata (titles, timestamps, relationships), user preferences, and encrypted API keys locally on the user's device using Chrome's storage APIs. Without this permission, Arbor cannot persist conversation trees between sessions, remember user settings, or store encrypted API keys securely. All data remains local and is never transmitted to external servers.

### activeTab Justification

The `activeTab` permission is required to detect when users are on ChatGPT conversation pages and interact with the page content. Arbor needs to detect the current chat, extract conversation titles and messages, and inject the sidebar UI into the active ChatGPT page. This permission ensures the extension only accesses tabs when the user explicitly interacts with ChatGPT pages, maintaining security and user control.

### tabs Justification

The `tabs` permission is necessary for Arbor's branch creation feature. When users create a branch from an existing conversation, the extension needs to open a new ChatGPT tab with the appropriate context. Additionally, Arbor needs to check tab URLs to determine which platform the user is on (ChatGPT) and to navigate to specific conversations when users click on tree nodes. Without this permission, users cannot create branches or navigate between conversations.

### scripting Justification

The `scripting` permission is required to inject Arbor's UI components (sidebar, graph view, and control buttons) into ChatGPT pages. The extension uses the scripting API to dynamically inject content scripts that render the tree view, graph visualization, and interaction controls. This is essential for displaying the extension's interface directly on ChatGPT pages without modifying the original page structure.

### unlimitedStorage Justification

The `unlimitedStorage` permission is necessary because users may create extensive conversation trees with hundreds or thousands of conversations over time. Each conversation node stores metadata, relationships, and potentially large amounts of context data. Standard storage quotas (typically 5-10MB) would quickly be exceeded for power users. The unlimited storage permission ensures Arbor can accommodate users with large conversation trees without running into storage limitations that would break the extension's functionality.

---

## 3. HOST PERMISSION JUSTIFICATION

**Host Permissions Requested:**

- `https://chatgpt.com/*`
- `https://chat.openai.com/*`
- `https://gemini.google.com/*`
- `https://perplexity.ai/*` (for future support)
- `https://generativelanguage.googleapis.com/*` (for Gemini API calls)

**Justification:**

1. **ChatGPT Domains** (`chatgpt.com/*`, `chat.openai.com/*`): These permissions are essential for Arbor's core functionality. The extension needs access to ChatGPT pages to:

   - Detect when users are viewing conversations
   - Extract conversation titles, messages, and metadata
   - Inject the sidebar UI and graph visualization
   - Enable tree navigation and branch creation features

2. **Gemini Domain** (`gemini.google.com/*`): Requested for future support of Google Gemini conversations. Currently, Arbor supports ChatGPT only, but this permission is included to support Gemini conversations in future updates.

3. **Perplexity Domain** (`perplexity.ai/*`): Requested for future support of Perplexity conversations. Currently not used, but included for planned multi-platform support.

All host permissions serve the single purpose of organizing and managing conversations. Data is processed locally, and API calls (when used) go directly from the user's browser to the service (Google Gemini API) using the user's own credentials.

---

## 4. REMOTE CODE DECLARATION

**Are you using remote code?** No, I am not using remote code.

All JavaScript and code is bundled and included in the extension package. The extension does not:

- Load external JavaScript files via `<script>` tags
- Use `eval()` or similar dynamic code evaluation
- Load external WASM modules
- Reference external modules or scripts at runtime

All code is statically included in the extension bundle and executed locally.

---

## 5. DATA USAGE DISCLOSURES

### What user data do you plan to collect from users now or in the future?

**Website Content**: ✓ Yes

The extension collects and stores website content from ChatGPT conversations, including:

- Conversation titles and messages
- Message timestamps and relationships
- Conversation metadata

**Important Notes:**

- All data is stored **locally** on the user's device (IndexedDB)
- Data is **never transmitted** to external servers (except when users explicitly use the Gemini API feature with their own API key)
- Users can view, export, or delete all collected data at any time
- No data is shared with third parties

**Other Data Categories:**

- ❌ Personally identifiable information: No
- ❌ Health information: No
- ❌ Financial and payment information: No
- ❌ Authentication information: No (except user's own encrypted API keys stored locally)
- ❌ Personal communications: No (only ChatGPT conversation content, stored locally)
- ❌ Location: No
- ❌ Web history: No (only detects ChatGPT pages for functionality)
- ❌ User activity: No

### Certifications

✓ **I do not sell or transfer user data to third parties, outside of the approved use cases**

✓ **I do not use or transfer user data for purposes that are unrelated to my item's single purpose**

✓ **I do not use or transfer user data to determine creditworthiness or for lending purposes**

---

## 6. PRIVACY POLICY

**Privacy Policy URL:**

If your privacy policy is hosted on GitHub, use:

```
https://raw.githubusercontent.com/[YOUR_USERNAME]/[YOUR_REPO]/main/Neur_chat/extension/PRIVACY_POLICY.md
```

Or if you have it hosted elsewhere, provide the full URL to your privacy policy.

**Note**: The privacy policy must be publicly accessible via HTTPS. The privacy policy is located at `/Users/alhassanahmed/Desktop/Chatbot/Neur_chat/extension/PRIVACY_POLICY.md` in the repository and should be hosted at a publicly accessible URL.

---

## SUMMARY CHECKLIST

- [x] Single purpose description provided (< 1000 characters)
- [x] Storage permission justified
- [x] activeTab permission justified
- [x] tabs permission justified
- [x] scripting permission justified
- [x] unlimitedStorage permission justified
- [x] Host permissions justified
- [x] Remote code declared (No)
- [x] Data usage disclosures completed
- [x] All three certifications checked
- [ ] Privacy policy URL provided (need to add your hosted URL)

---

## ADDITIONAL NOTES

1. **Privacy Policy Hosting**: You'll need to host your `PRIVACY_POLICY.md` file at a publicly accessible HTTPS URL. Options include:

   - GitHub (recommended): Create a repo and link to the raw file
   - GitHub Pages
   - Your own website
   - Any static file hosting service

2. **Future Support**: The extension currently supports ChatGPT only. Permissions for Gemini and Perplexity are included for future platform support but are not actively used in the current version.

3. **API Key Handling**: Users provide their own Gemini API keys if they want to use AI features. These keys are encrypted and stored locally, and API calls go directly from the user's browser to Google's API.

4. **Data Privacy**: All conversation data is stored locally and never transmitted to external servers except for explicit user-initiated API calls using the user's own credentials.
