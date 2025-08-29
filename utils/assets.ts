// Asset paths have been updated to be served from the root.
// This is configured in vite.config.ts by setting 'publicDir' to 'media',
// which makes files inside the 'media' folder available at the server root.
export const logoUrl = '/tdlogo.png';

// The original /media/cover.png asset is missing from the project files. 
// A suitable fallback image from the app's existing scenes is used here to fix the broken image link.
export const coverUrl = 'https://images.unsplash.com/photo-1598535342412-4d7514d355bd?q=80&w=2070&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
