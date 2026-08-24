import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function getBase(command: string) {
  if (command === "serve") {
    return "/";
  }

  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    return "/";
  }

  const repoName = repository.split("/")[1] ?? "";
  return repoName.endsWith(".github.io") ? "/" : `/${repoName}/`;
}

export default defineConfig(({ command }) => ({
  base: getBase(command),
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
