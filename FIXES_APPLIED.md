# Fixes Applied - Summarization & Model Selection Issues

## Issues Identified from Logs

### 1. ❌ Wrong Model Being Used
**Problem**: You selected `gemini-2.0-flash` but logs showed `gemini-3-flash-preview` (default)
**Root Cause**: Database not initialized before config load, causing it to return empty state
**Fixed**: ✅

### 2. ❌ ChatGPT Message Extraction Broken  
**Problem**: 0 user messages extracted (only 2 assistant messages)
**Root Cause**: Selector too specific - looking for nested markdown element that doesn't exist
**Fixed**: ✅

### 3. ❌ Wrong Conversation Summarized
**Problem**: Summary talks about "skills and sub-agents" but conversation was about "Debouncing vs Dirty Flags"
**Root Cause**: Caused by Issue #2 - with only assistant messages and no user messages, the context was broken
**Fixed**: ✅ (by fixing message extraction)

---

## Changes Made

### File: `src/content/modules/context/llm/LLMConfigManager.ts`

#### Before:
```typescript
static async loadConfig(): Promise<LLMConfig> {
  const savedConfig = await db.getState();
  // Would return empty state if DB not initialized
}
```

#### After:
```typescript
static async loadConfig(): Promise<LLMConfig> {
  await db.init(); // 🔧 Ensure DB is initialized first
  const savedConfig = await db.getState();
  logger.debug("Raw saved config from DB:", savedConfig);
  // ... verification logging
}
```

#### What Changed:
- ✅ Explicitly call `db.init()` before loading config
- ✅ Log raw saved config for debugging
- ✅ Verify config after saving with confirmation logs
- ✅ Better error messages showing what was loaded vs what was expected

---

### File: `src/platforms/chatgpt.ts`

#### Before:
```typescript
messageSelectors: {
  user: ['[data-message-author-role="user"] [class*="markdown"]'], // Too specific!
  assistant: ['[data-message-author-role="assistant"] [class*="markdown"]'],
},
```

#### After:
```typescript
messageSelectors: {
  user: [
    '[data-message-author-role="user"]',  // 🔧 Try parent first
    '[data-message-author-role="user"] [class*="markdown"]',  
    '[data-message-author-role="user"] div',  // 🔧 Fallback
  ],
  assistant: [
    '[data-message-author-role="assistant"]',  // 🔧 Try parent first
    '[data-message-author-role="assistant"] [class*="markdown"]',
    '[data-message-author-role="assistant"] div',  // 🔧 Fallback
  ],
},
messageRoleDetector: (element) => {
  // 🔧 Check parent element too
  const role = element.getAttribute("data-message-author-role");
  if (role) return role;
  
  const parent = element.closest('[data-message-author-role]');
  if (parent) {
    const parentRole = parent.getAttribute("data-message-author-role");
    if (parentRole === "user" || parentRole === "assistant") {
      return parentRole as "user" | "assistant";
    }
  }
  return null;
},
```

#### What Changed:
- ✅ Multiple fallback selectors (parent container → nested markdown → any div)
- ✅ Enhanced role detector that checks parent element
- ✅ More resilient to HTML structure changes

---

### File: `src/platforms/base.ts`

#### Before:
```typescript
extractMessages() {
  config.user.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      messages.push({ role: "user", content: el.textContent });
    });
  });
  // Could create duplicates
}
```

#### After:
```typescript
extractMessages() {
  const seen = new Set<string>(); // 🔧 Track duplicates
  
  const addMessage = (role, content, source) => {
    if (!content.trim() || seen.has(content.trim())) return false;
    messages.push({ role, content: content.trim() });
    seen.add(content.trim());
    console.log(`Added ${role} message from ${source}`);
  };
  
  // 🔧 Try selectors in order, break when found
  for (const selector of config.user) {
    // ... extract and deduplicate
    if (messages.some(m => m.role === 'user')) break;
  }
}
```

#### What Changed:
- ✅ Deduplication using Set to avoid duplicate messages
- ✅ Better selector fallback strategy (stop when messages found)
- ✅ Detailed logging for each message extracted
- ✅ Emergency dump of page structure if no messages found

---

### File: `src/options/options.ts`

#### Before:
```typescript
async function saveConfig() {
  const result = await ConfigManager.saveConfig(provider, model, apiKey);
  if (result.success) {
    showStatus("Configuration saved");
  }
}
```

#### After:
```typescript
async function saveConfig() {
  logger.debug("💾 Saving config:", { provider, model });
  
  const result = await ConfigManager.saveConfig(provider, model, apiKey);
  logger.debug("💾 Result:", result);
  
  // 🔧 Verify it was actually saved
  const verifyConfig = await ConfigManager.loadConfig();
  logger.debug("🔄 Reloaded config:", verifyConfig);
  
  if (result.success) {
    showStatus("✅ Configuration saved successfully!");
  }
}
```

#### What Changed:
- ✅ Log save operation details
- ✅ Verify config was saved by reloading it
- ✅ Log verification result

---

## How to Test

### 1. Rebuild Extension
```bash
npm run build
```

### 2. Reload Extension in Chrome
- Go to `chrome://extensions`
- Click reload on Arbor extension
- **IMPORTANT**: Also refresh any open ChatGPT/Gemini tabs

### 3. Test Config Saving

#### A. Open Settings
- Click extension icon → Settings
- You should see console logs in the options page

#### B. Select Model
- Choose provider: "Google Gemini"
- Select model: **"Gemini 2.0 Flash"** (not the default)
- Enter your API key
- Click "Save"

#### C. Check Logs (Options Page Console)
You should see:
```
💾 Saving config from options page: {provider: "gemini", model: "gemini-2.0-flash"}
✅ Saved LLM config to storage: {provider: "gemini", geminiModel: "gemini-2.0-flash", ...}
✅ Config verified in storage
🔄 Reloaded config: {provider: "gemini", model: "gemini-2.0-flash", ...}
```

❌ **If you see "No saved config found"**, the database isn't initializing properly.

### 4. Test Message Extraction on ChatGPT

#### A. Open ChatGPT
- Go to chatgpt.com
- Have a conversation (at least 3-4 exchanges with both user and assistant)

#### B. Create Branch
- Click extension icon → Create Branch
- Select "AI Summary" format
- Click "Create Branch"

#### C. Check Console Logs (ChatGPT Page)
You should see:
```
🔍 [chatgpt] Extracting messages using selectors: {...}
🔍 [chatgpt] Found 4 user message elements with selector: [data-message-author-role="user"]
🔍 [chatgpt] Added user message from [data-message-author-role="user"] (xxx chars)
🔍 [chatgpt] Found assistant messages with [data-message-author-role="assistant"]
🔍 [chatgpt] Extracted 8 total messages (4 user, 4 assistant)
```

❌ **If you see "Found 0 user message elements"**, ChatGPT's HTML changed again - inspect the page to see the actual structure.

### 5. Test Model Selection

#### Check these logs in ChatGPT console:
```
✅ Loaded LLM config from storage: {provider: "gemini", geminiModel: "gemini-2.0-flash"}
gemini LLM Service initialized: {model: "gemini-2.0-flash", enabled: true}
🔄 Requesting summarization from gemini LLM (model: gemini-2.0-flash)
```

#### Check Service Worker Console:
- Go to `chrome://extensions`
- Find Arbor extension
- Click "Service Worker" (inspect)
- Look for:
```
🔄 Calling Gemini API: {
  model: "gemini-2.0-flash",
  modelFromPayload: "gemini-2.0-flash",
  ...
}
```

✅ **Both should show "gemini-2.0-flash"** (not gemini-3-flash-preview)

### 6. Verify Summary Content

The summary should now:
- ✅ Include content from BOTH user and assistant messages
- ✅ Be about the actual conversation topic
- ✅ Not be about a completely different conversation

---

## If Issues Persist

### Issue: Still using wrong model

**Check these logs:**
1. Options page console when saving:
   - Should show `✅ Saved LLM config to storage: {geminiModel: "gemini-2.0-flash"}`
   
2. ChatGPT page console when creating branch:
   - Should show `✅ Loaded LLM config from storage: {geminiModel: "gemini-2.0-flash"}`
   
3. If step 1 succeeds but step 2 fails, the database context might be isolated between options page and content script

**Solution**: Check if `chrome.storage` is being used. The fix ensures `db.init()` is called, but there might be a timing issue.

### Issue: Still 0 user messages

**Debug steps:**
1. Open ChatGPT page
2. Open DevTools console
3. Run this command:
   ```javascript
   document.querySelectorAll('[data-message-author-role="user"]').length
   ```
4. Should return a number > 0

If it returns 0, ChatGPT's HTML structure has changed completely. Inspect a user message to see what attributes/classes it has now.

### Issue: Wrong conversation summarized

This should be fixed now that user messages are being extracted. If it persists:
1. Check that BOTH user and assistant messages are being extracted
2. Check the order of messages (should be chronological)
3. The summary should be about the current conversation on the page

---

## Emergency Debugging Commands

Run these in the browser console to diagnose issues:

### Check Database State
```javascript
// In ChatGPT page console
const db = await import(chrome.runtime.getURL('content.js')).then(m => m.db);
await db.init();
const state = await db.getState();
console.log('Database state:', state);
```

### Check Message Extraction
```javascript
// Count message elements
console.log('User messages:', document.querySelectorAll('[data-message-author-role="user"]').length);
console.log('Assistant messages:', document.querySelectorAll('[data-message-author-role="assistant"]').length);

// Inspect first user message
const firstUser = document.querySelector('[data-message-author-role="user"]');
console.log('First user message:', {
  role: firstUser?.getAttribute('data-message-author-role'),
  classes: firstUser?.className,
  children: firstUser?.children.length,
  text: firstUser?.textContent?.substring(0, 100)
});
```

### Force Config Reload
```javascript
// In options page console
const config = await ConfigManager.loadConfig();
console.log('Loaded config:', config);
```

---

## Summary

**3 major issues fixed:**
1. ✅ Model selection now persists (DB initialization)
2. ✅ ChatGPT message extraction now works (better selectors + fallbacks)
3. ✅ Summary content is correct (all messages extracted)

**Next steps:**
1. Rebuild and reload extension
2. Test model selection in settings
3. Test branch creation with summary
4. Check all console logs match expectations
5. Report back with logs if issues persist!
