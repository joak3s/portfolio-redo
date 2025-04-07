# Clearing Browser Cookies for Authentication Troubleshooting

If you're experiencing issues with Supabase authentication in your Next.js application, clearing your browser cookies can help resolve many common problems. This guide explains how to clear cookies for your development environment.

## Quick Cookie Clearing by Browser

### Chrome
1. While on your app's page (e.g., http://localhost:3000), click the lock/info icon in the address bar
2. Click "Cookies and site data"
3. Click "Remove" to clear all cookies for this site
4. Reload the page

### Firefox
1. While on your app's page, click the lock icon in the address bar
2. Click "Clear Cookies and Site Data"
3. Confirm by clicking "Remove"
4. Reload the page

### Safari
1. With your app open, click Safari in the menu bar
2. Click "Settings" then "Privacy"
3. Click "Manage Website Data"
4. Search for "localhost" or your domain
5. Select it and click "Remove"
6. Reload the page

### Edge
1. While on your app's page, click the lock icon in the address bar
2. Click "Cookies and site permissions"
3. Click "Manage and delete cookies and site data"
4. Under "All cookies and site data," search for your site
5. Select and delete those cookies
6. Reload the page

## Specific Supabase Cookies to Clear

If you're having issues with Supabase authentication specifically, look for and clear these cookies:

- `sb-[project-ref]-auth-token`
- `supabase-auth-token`
- Any cookie starting with `sb-` or `supabase-`

## Hard Refresh After Clearing

After clearing cookies, perform a hard refresh:
- Windows/Linux: `Ctrl + F5`
- Mac: `Cmd + Shift + R`

## Server-Side Testing

If you're still having issues, use the included verification scripts:
```bash
# Test direct authentication with Supabase
node scripts/verify-supabase-config.js youremail@example.com yourpassword

# Reset your password if needed
node scripts/update-user.js youremail@example.com newpassword
```

## Incognito/Private Browsing

For quick testing without clearing cookies, use an incognito/private browsing window which starts with a clean cookie state.

## Session Storage

For complete reset, also clear local storage and session storage in your browser's developer tools:
1. Open DevTools (F12 or right-click > Inspect)
2. Go to "Application" tab (Chrome/Edge) or "Storage" (Firefox)
3. Select "Local Storage" and "Session Storage" 
4. Clear both for your domain 