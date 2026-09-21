import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["blom-academy-favicon.webp", "pwa-icon-192.png", "pwa-icon-512.png", "pwa-icon-512-maskable.png"],
      manifest: {
        name: "BLOM Academy",
        short_name: "BLOM Academy",
        description: "Learn beautiful nail art techniques with BLOM Academy",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        id: "/",
        icons: [
          {
            src: "/pwa-icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
        categories: ["education", "lifestyle"],
        shortcuts: [
          {
            name: "Explore Courses",
            short_name: "Courses",
            url: "/explore",
            description: "Browse all available courses"
          },
          {
            name: "My Profile",
            short_name: "Profile",
            url: "/profile",
            description: "View your profile and enrollments"
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
