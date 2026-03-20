Three critical issues to fix:

1. SSR is not working — curl http://localhost:3000 shows empty <body>
   - renderToString() result must be inserted into the HTML response body
   - Fix the server HTML handler

2. Tailwind CSS browser runtime is loaded via CDN script tag:
   <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.2.1"></script>
   This is extremely heavy — it processes CSS at runtime in the browser.
   Replace with build-time CSS generation:
   - Install @tailwindcss/vite
   - Add to vite.config.ts plugins
   - Remove the CDN script tag from HTML
   - Add @import "tailwindcss" to the CSS entry file

3. DM pages broken: "ユーザー名の入力に失敗"
   - Check NewDirectMessageModalPage.tsx
   - Verify input has id attribute and label has matching htmlFor
   - Fix if missing

Validate with typecheck and build after all changes.
