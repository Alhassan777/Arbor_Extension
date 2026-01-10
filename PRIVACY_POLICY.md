# Privacy Policy for Arbor Browser Extension

**Last Updated**: January 2025  
**Extension Version**: 1.0.0

## Overview

Arbor ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use the Arbor browser extension.

## Information We Collect

### 1. Local Storage Data

Arbor stores the following information **locally on your device**:

- **Conversation Trees**: Hierarchical organization of your ChatGPT conversations (currently ChatGPT only - support for other platforms coming soon)
- **Chat Metadata**: Titles, timestamps, and relationships between conversations
- **Extension Settings**: Your preferences for tree organization and display

**All this data is stored in your browser's IndexedDB and never transmitted to external servers.**

### 2. API Keys

If you choose to use the Gemini AI summarization feature:

- **Gemini API Key**: Your Google/Gemini API key is stored **locally on your device** in encrypted form
- **Encryption**: API keys are encrypted using Web Crypto API (AES-GCM) before storage
- **Storage Location**: `chrome.storage.local` (Chrome/Edge/Brave) - not synced across devices by default

**Your API key is only used to authenticate with Google's Gemini API. It is never shared with us or any third parties.**

### 3. Usage Information

Arbor does **not** collect, track, or transmit:

- Your conversation content
- Personal information
- Browsing history (beyond detecting supported chat platforms)
- Analytics data
- Usage statistics
- Crash reports

## How We Use Your Information

### Local Processing

- **Chat Organization**: We use locally stored data to display your conversation trees and graphs
- **Branch Creation**: When creating branches, we extract messages from the current page and format them locally
- **Context Generation**: If you use Gemini summarization, your API key is used to authenticate API calls directly from your browser to Google's servers

### API Calls

When you use the Gemini summarization feature:

- Messages are extracted from the current page
- Formatted context is sent **directly from your browser** to Google's Gemini API (`generativelanguage.googleapis.com`)
- **No intermediate servers**: Requests go directly: Your Browser → Google API
- API responses (summaries) are processed locally and never stored externally

## Data Storage and Security

### Local Storage

- All conversation trees and metadata are stored in your browser's IndexedDB
- Data persists locally on your device
- Data is **not** automatically synced across devices (unless you use browser sync features)
- You can export/import your data at any time

### API Key Security

- API keys are encrypted using Web Crypto API (AES-GCM) before storage
- Encryption keys are derived from your extension installation
- Keys are only decrypted when needed for API authentication
- We never log or display your full API key (always redacted in logs)

### Third-Party Services

Arbor only communicates with:

- **Google Gemini API** (`generativelanguage.googleapis.com`): Only when you explicitly use summarization features, using your own API key
- **Supported Chat Platforms**: Currently supports ChatGPT only. We detect ChatGPT pages to inject the extension UI, but do not modify or transmit data from these sites. Support for other platforms (Gemini, Perplexity) coming soon.

**We do not use analytics services, tracking pixels, or any other third-party services that collect data.**

## Data Sharing

**We do not share, sell, rent, or transmit your data to any third parties.**

- Your conversation trees remain on your device
- Your API key is only used for your own Gemini API calls
- No data is sent to our servers (we don't operate any servers for this extension)

## User Rights and Control

You have full control over your data:

### Viewing Your Data

- All stored data is visible through the extension's sidebar interface
- You can view, edit, and delete conversation trees at any time

### Exporting Your Data

- Conversation trees can be exported (feature available in extension)
- You can export your IndexedDB data using browser developer tools

### Deleting Your Data

- **Remove Extension**: Uninstalling the extension removes all local data (IndexedDB, storage)
- **Clear Specific Trees**: Delete individual trees or nodes through the extension UI
- **Remove API Key**: Delete your API key at any time through the extension options page

### API Key Management

- Add, replace, or remove your API key through the extension options page
- If you suspect your key is compromised, revoke it in Google Cloud Console and create a new one

## Children's Privacy

Arbor is not directed to children under 13. We do not knowingly collect information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can delete it.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by:

- Updating the "Last Updated" date
- Displaying a notification in the extension (if significant changes)
- Posting the new policy on this page

## Contact Information

If you have questions about this Privacy Policy or our data practices:

- **GitHub Issues**: Open an issue on our repository
- **Email**: Contact through the extension's support channels

## Compliance

### GDPR (European Users)

If you are in the European Economic Area (EEA):

- All data is stored locally on your device
- You can export or delete your data at any time
- We do not transfer your data outside your device without your explicit action (API calls with your API key)

### CCPA (California Users)

If you are a California resident:

- We do not sell your personal information
- We do not share your personal information with third parties
- You have the right to know what data we collect (everything is stored locally and visible in the extension)
- You can delete all your data by uninstalling the extension

## Technical Details

### Permissions Explanation

- **`storage`**: To store your conversation trees and settings locally
- **`activeTab`**: To detect and interact with chat pages
- **`tabs`**: To open new chat windows when creating branches
- **`scripting`**: To inject the extension UI into chat pages
- **`unlimitedStorage`**: To support large conversation trees
- **`host_permissions`**: To detect chat platforms and access Gemini API (only with your API key)

### Data Encryption

API keys are encrypted using:
- **Algorithm**: AES-GCM (Advanced Encryption Standard - Galois/Counter Mode)
- **Key Derivation**: From extension installation ID
- **IV Generation**: Unique initialization vector for each encryption

## Summary

**TL;DR**: Arbor stores everything locally on your device. Your conversation trees, settings, and encrypted API keys never leave your device except for direct API calls to Google's Gemini API (which you control with your own API key). We don't collect, track, or share any data.
