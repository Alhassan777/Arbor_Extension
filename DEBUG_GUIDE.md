# Debug Guide for Summarization and Clipboard Issues

## Issues Fixed

### 1. Clipboard Error - "Document is not focused"
**Problem**: The `navigator.clipboard.writeText()` API requires the document to have focus, which was causing the error.

**Solution**: Implemented a multi-fallback clipboard strategy in `src/platforms/base.ts`:
1. Try `navigator.clipboard` (modern API)
2. Try focusing window first, then retry
3. Fallback to `document.execCommand('copy')` (deprecated but works without focus)

### 2. Summarization Not Working
**Problem**: The conversation wasn't being summarized properly.

**Solution**: Added comprehensive logging throughout the summarization pipeline to diagnose:
- Message extraction from page
- LLM service initialization
- Model selection from settings
- API call execution

## How to Debug

### Check the Console Logs

After running the extension, open the browser console and look for these key log messages:

#### 1. Message Extraction
```
🔍 [gemini] Extracting messages using selectors: {...}
🔍 [gemini] Found X user message elements with selector: ...
🔍 [gemini] Extracted X total messages (X user, X assistant)
```
**What to check**: Make sure messages are being extracted. If you see "0 messages", the selectors may need updating.

#### 2. Branch Context Creation
```
🌳 Arbor: Extracted X total messages from page
🌳 Arbor: Processing X messages for branching (format: summary)
🌳 Arbor: Message breakdown: {...}
```
**What to check**: Verify messages are being passed to the branching system.

#### 3. LLM Configuration
```
🌳 Arbor: Loaded LLM config from storage: {provider: "gemini", geminiModel: "gemini-2.5-flash", ...}
gemini LLM Service initialized: {model: "gemini-2.5-flash", enabled: true, ...}
```
**What to check**: Verify the model matches what you selected in settings.

#### 4. Summarization Process
```
🌳 Arbor: Starting AI summarization...
🌳 Arbor: - Messages to summarize: X
🌳 Arbor: - Has LLM service: true
🌳 Arbor: Loaded config - Provider: gemini, Model: gemini-2.5-flash
🌳 Arbor: ✅ LLM service available (GeminiLLMService), generating AI summary...
```
**What to check**: Make sure the LLM service is available and not falling back to text-based summary.

#### 5. API Call
```
🔄 Requesting summarization from gemini LLM (model: gemini-2.5-flash)
📊 Summarization details: {provider: "gemini", model: "gemini-2.5-flash", ...}
```
**What to check**: This shows the exact model being sent to the API.

#### 6. Background Script (Check Service Worker Console)
```
🔄 Calling Gemini API: {
  model: "gemini-2.5-flash",
  modelFromPayload: "gemini-2.5-flash",
  defaultModel: "gemini-3-flash-preview",
  ...
}
```
**What to check**: 
- `modelFromPayload` should match your settings selection
- If it shows `defaultModel` instead, the config isn't being loaded correctly

#### 7. Summary Result
```
🌳 Arbor: ✅ AI summary generated using GeminiLLMService
🌳 Arbor: Summary length: X characters
🌳 Arbor: Summary preview: ...
🌳 Arbor: 📝 Final summary mode: GeminiLLMService
```
**What to check**: 
- If mode is "text-based", the AI summarization failed
- Check summary preview to verify it's actually a summary

#### 8. Clipboard
```
🌳 Arbor: Attempting to copy X characters to clipboard...
✅ Copied to clipboard using navigator.clipboard
```
**What to check**: If clipboard fails, you'll see error messages with fallback attempts.

## Common Issues

### Issue: No messages extracted
**Symptoms**: Logs show "Extracted 0 total messages"
**Cause**: Gemini's HTML structure changed
**Solution**: Update the selectors in `src/platforms/gemini.ts`

### Issue: Using wrong model
**Symptoms**: Logs show different model than selected in settings
**Cause**: Config not being saved or loaded correctly
**Check**:
1. Go to extension settings
2. Select your desired model
3. Click Save
4. Check logs for "Loaded LLM config from storage"
5. Verify the model matches

### Issue: Falling back to text-based summary
**Symptoms**: Logs show "text-based summary" instead of AI service name
**Causes**:
1. API key not configured or invalid
2. LLM service not available
3. API call failed

**Solution**:
1. Check logs for "LLM service not available"
2. Go to extension settings
3. Verify API key is configured
4. Click "Validate" to test the key

### Issue: Clipboard fails
**Symptoms**: Error "Failed to copy to clipboard"
**Causes**:
1. Page doesn't have focus
2. Browser security restrictions

**Solution**:
- Click on the page before creating a branch
- The extension will try multiple fallback methods
- If all fail, the context will be shown in an alert to copy manually

## Testing Steps

1. **Install the updated extension**
   ```bash
   npm run build
   # Load unpacked extension in Chrome
   ```

2. **Open Gemini chat**
   - Go to gemini.google.com
   - Have a conversation (at least 3-4 exchanges)

3. **Open settings and configure**
   - Click extension icon → Settings
   - Select your desired model (e.g., "gemini-2.5-flash")
   - Enter API key if not already set
   - Click Save

4. **Test branch creation**
   - Click extension icon → Create Branch
   - Select "AI Summary" format
   - Click "Create Branch"

5. **Check console logs**
   - Open DevTools (F12)
   - Check Console tab for the logs listed above
   - Also check Service Worker console (chrome://extensions → Details → Service Worker → Inspect)

6. **Verify results**
   - Context should be copied to clipboard
   - New chat should open with summarized context
   - Summary should be AI-generated (not just "We discussed...")

## Report Issues

If you still encounter problems, please provide:
1. All console logs (both page and service worker)
2. Your settings (provider and model)
3. Screenshot of the error
4. Steps to reproduce
