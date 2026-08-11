Fix the current Vite build error in the GY Data repository.

The current build error is:

src/pages/super-admin/SuperAdminLogindashboard (101:20):
Failed to parse source for import analysis because the content contains invalid JS syntax.
If you are using JSX, make sure to name the file with the .jsx or .tsx extension.

IMPORTANT:
There are currently two Super Admin dashboard files:

1. src/pages/super-admin/SuperAdminDashboard.tsx
   This is now the canonical dashboard implementation and is the file imported by App.tsx.

2. src/pages/super-admin/SuperAdminLogindashboard
   This is the old duplicate file WITHOUT a .tsx extension and it contains JSX.
   Vite is trying to process it and failing.

TASK:

1. Keep:
   src/pages/super-admin/SuperAdminDashboard.tsx

2. Delete the obsolete file:
   src/pages/super-admin/SuperAdminLogindashboard

3. Do NOT rename or modify SuperAdminDashboard.tsx.

4. Do NOT change the Super Admin UI or behavior.

5. Do NOT change normal user Login.

6. Do NOT change the Super Admin credentials:
   Email: sadmin@gyd.com
   PIN: 1251

7. Do NOT change the secret lower-left double-tap behavior.

8. Check src/App.tsx and confirm it imports exactly:

import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";

9. Search the entire src directory for any remaining imports or references to:
   SuperAdminLogindashboard

   If any exist, update them to:
   SuperAdminDashboard

10. Search for any other duplicate Super Admin dashboard files that could contain JSX without .tsx/.jsx extensions.

11. After the cleanup, run:

npm run build

12. Do not report success until the build actually passes.

The goal is to have ONE canonical Super Admin Dashboard:

src/pages/super-admin/SuperAdminDashboard.tsx

and no obsolete JSX file named:

src/pages/super-admin/SuperAdminLogindashboard
