# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## 3D Configurator — Extension Guide

### Adding a new material preset

Edit `src/lib/materials.ts`:

```ts
// Add to MATERIALS object
myCustomMaterial: createPBRMaterial({
  color: '#hex',
  metalness: 0.4,
  roughness: 0.6,
  envMapIntensity: 1.2,
  clearcoat: 0.2,         // optional
  clearcoatRoughness: 0.3, // optional
}),
```

For frame colors (powdercoated aluminum), use `createFrameMaterial(hex)` — it auto-boosts
environment reflections on dark colors to prevent black-on-black loss.

### Adding a new environment/lighting preset

Edit the `LIGHTING` constant in `src/components/configurator/PatioScene.tsx`:

```ts
const LIGHTING = {
  // ...existing presets...
  myPreset: {
    ambient: 0.3,
    dir1: 1.5,        // key light intensity
    dir2: 0.4,        // fill light intensity
    dir1Color: '#fff', // key light color
    dir2Color: '#ccf', // fill light color
    env: 'park',       // drei Environment preset name
    fogColor: '#aaa',
    bgGradient: 'linear-gradient(180deg, #ccc 0%, #999 100%)',
  },
};
```

### Quality presets

Three quality levels are available in `src/lib/materials.ts`:
- **High**: 2048 shadow maps, full contact shadows
- **Balanced** (default): 1024 shadows, moderate quality
- **Low**: No shadows, minimal effects for weaker hardware

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
