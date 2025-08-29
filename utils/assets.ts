// By exporting the paths directly as strings, we bypass the module system
// that was causing resolution errors. This approach relies on Vite's static
// asset serving. For this to work, the 'media' folder containing the images
// must be placed inside a 'public' directory at the root of the project.

export const logoUrl = '/media/tdlogo.png';
export const coverUrl = '/media/cover.png';
