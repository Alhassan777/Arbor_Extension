# Quick Copy - Chrome Web Store Publishing Info

## Arbor - Chat Tree Navigator

Copy the text below directly into the Chrome Web Store publishing forms.

---

## 1. SINGLE PURPOSE DESCRIPTION

```
Organize and manage ChatGPT conversations in hierarchical tree structures for easy navigation and relationship tracking. Arbor provides a single, focused purpose: allowing users to organize their ChatGPT conversations into navigable tree structures. Users can create branches from existing conversations, visualize relationships through interactive graphs, and seamlessly navigate between related chats. All data is stored locally on the user's device. The extension optionally uses AI-powered context generation (via user's own Gemini API key) to summarize conversations when creating branches. This single purpose of conversation organization and navigation is narrow, well-defined, and easy to understand.
```

---

## 2. STORAGE JUSTIFICATION

```
The storage permission is essential for Arbor's core functionality. The extension stores conversation trees, chat metadata (titles, timestamps, relationships), user preferences, and encrypted API keys locally on the user's device using Chrome's storage APIs. Without this permission, Arbor cannot persist conversation trees between sessions, remember user settings, or store encrypted API keys securely. All data remains local and is never transmitted to external servers.
```

---

## 3. activeTab JUSTIFICATION

```
The activeTab permission is required to detect when users are on ChatGPT conversation pages and interact with the page content. Arbor needs to detect the current chat, extract conversation titles and messages, and inject the sidebar UI into the active ChatGPT page. This permission ensures the extension only accesses tabs when the user explicitly interacts with ChatGPT pages, maintaining security and user control.
```

---

## 4. tabs JUSTIFICATION

```
The tabs permission is necessary for Arbor's branch creation feature. When users create a branch from an existing conversation, the extension needs to open a new ChatGPT tab with the appropriate context. Additionally, Arbor needs to check tab URLs to determine which platform the user is on (ChatGPT) and to navigate to specific conversations when users click on tree nodes. Without this permission, users cannot create branches or navigate between conversations.
```

---

## 5. scripting JUSTIFICATION

```
The scripting permission is required to inject Arbor's UI components (sidebar, graph view, and control buttons) into ChatGPT pages. The extension uses the scripting API to dynamically inject content scripts that render the tree view, graph visualization, and interaction controls. This is essential for displaying the extension's interface directly on ChatGPT pages without modifying the original page structure.
```

---

## 6. unlimitedStorage JUSTIFICATION

```
The unlimitedStorage permission is necessary because users may create extensive conversation trees with hundreds or thousands of conversations over time. Each conversation node stores metadata, relationships, and potentially large amounts of context data. Standard storage quotas (typically 5-10MB) would quickly be exceeded for power users. The unlimited storage permission ensures Arbor can accommodate users with large conversation trees without running into storage limitations that would break the extension's functionality.
```

---

## 7. HOST PERMISSION JUSTIFICATION

```
Host permissions are essential for Arbor's core functionality:

1. ChatGPT Domains (chatgpt.com, chat.openai.com): Required to detect conversations, extract titles/messages, inject UI (sidebar, graph view), and enable navigation/branch creation.

2. Gemini Domain (gemini.google.com): For future support of Google Gemini conversations (currently unused, planned feature).

3. Perplexity Domain (perplexity.ai): For future support of Perplexity conversations (currently unused, planned feature).

4. Google Gemini API (generativelanguage.googleapis.com): Required for optional AI-powered context generation when users provide their own Gemini API key. Users make direct API calls from their browser to generate conversation summaries when creating branches.

All host permissions serve the single purpose of organizing and managing conversations. Data is processed locally, and API calls (when used) go directly from the user's browser to Google's API using the user's own credentials. No data is transmitted to external servers except for user-initiated API calls.
```

---

## 8. REMOTE CODE

**Select:** No, I am not using Remote code

(No justification needed - all code is bundled in the extension)

---

## 9. DATA USAGE DISCLOSURES

### What user data do you plan to collect?

✅ **Website Content** - Yes

**Justification:** The extension collects conversation titles, messages, timestamps, and metadata from ChatGPT conversations. All data is stored locally on the user's device (IndexedDB) and never transmitted to external servers except when users explicitly use the Gemini API feature with their own API key. Users can view, export, or delete all data at any time.

❌ **All other categories** - No

- Personally identifiable information: No
- Health information: No
- Financial and payment information: No
- Authentication information: No (except user's own encrypted API keys stored locally)
- Personal communications: No (only ChatGPT conversation content, stored locally)
- Location: No
- Web history: No
- User activity: No

### Certifications (Check all three):

✅ **I do not sell or transfer user data to third parties, outside of the approved use cases**

✅ **I do not use or transfer user data for purposes that are unrelated to my item's single purpose**

✅ **I do not use or transfer user data to determine creditworthiness or for lending purposes**

---

## 10. PRIVACY POLICY URL

**⚠️ IMPORTANT:** You need to host your `PRIVACY_POLICY.md` file at a publicly accessible HTTPS URL.

**Options:**

1. **GitHub (Recommended):**

   - Create a GitHub repository
   - Upload `PRIVACY_POLICY.md`
   - Use the raw file URL:

   ```
   https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/Neur_chat/extension/PRIVACY_POLICY.md
   ```

2. **GitHub Pages:**

   - Enable GitHub Pages on your repo
   - Use: `https://YOUR_USERNAME.github.io/YOUR_REPO/PRIVACY_POLICY.md`

3. **Your own domain:**
   - Host it on your website
   - Use: `https://yourdomain.com/privacy-policy.html`

**Once you have the URL, paste it in the Privacy Policy URL field.**

---

## CHECKLIST BEFORE SUBMISSION

- [ ] Single purpose description copied
- [ ] All 5 permission justifications copied
- [ ] Host permission justification copied
- [ ] Remote code set to "No"
- [ ] Website Content selected as "Yes" in data usage
- [ ] All other data categories set to "No"
- [ ] All three certifications checked
- [ ] Privacy policy hosted and URL ready
- [ ] Privacy policy URL is publicly accessible via HTTPS
- [ ] Review all information for accuracy

---

## NOTES

- The extension currently supports **ChatGPT only**
- Permissions for Gemini and Perplexity are for future support
- All conversation data is stored **locally** on the user's device
- API calls (if used) go directly from user's browser to Google's API using the user's own API key
- No data is sold, shared, or transmitted to third parties
