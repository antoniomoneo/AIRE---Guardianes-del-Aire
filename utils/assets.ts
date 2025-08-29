// The logo is now an embedded SVG data URL to ensure it loads reliably in all environments,
// resolving issues with asset paths in production builds.
export const logoUrl = `data:image/svg+xml,%3Csvg width='200' height='40' viewBox='0 0 200 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cstyle%3E.text { font-family: Orbitron, sans-serif; font-size: 28px; font-weight: 700; fill: %23e0e7ff; } .highlight { fill: %2367e8f9; }%3C/style%3E%3Ctext x='0' y='30' class='text'%3ET%3Ctspan class='highlight'%3Ea%3C/tspan%3Engible D%3Ctspan class='highlight'%3Ea%3C/tspan%3Et%3Ctspan class='highlight'%3Ea%3C/tspan%3E%3C/text%3E%3C/svg%3E`;

// The original /media/cover.png asset is missing from the project files. 
// A suitable fallback image from the app's existing scenes is used here to fix the broken image link.
export const coverUrl = 'https://images.unsplash.com/photo-1598535342412-4d7514d355bd?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';