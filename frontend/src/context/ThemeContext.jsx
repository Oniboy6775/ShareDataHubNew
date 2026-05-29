import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import defaultTheme from "../theme.config";

const ThemeContext = createContext(null);
const ThemeUpdateContext = createContext(null);

function hexToRgbVars(hex) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function applyColors(colors) {
  const root = document.documentElement;
  const map = {
    primary: "--tw-primary",
    secondary: "--tw-secondary",
    dark: "--tw-dark",
    darker: "--tw-darker",
    light: "--tw-light",
  };
  Object.entries(map).forEach(([key, cssVar]) => {
    if (colors[key]) root.style.setProperty(cssVar, hexToRgbVars(colors[key]));
  });
}

function buildOverrides(data) {
  return {
    siteName: data.siteName || defaultTheme.siteName,
    logo: data.logoUrl || defaultTheme.logo || null,
    supportWhatsapp: data.supportPhone || defaultTheme.supportWhatsapp,
    channelLink: data.channelLink || defaultTheme.channelLink || "",
    googleFormUrl: data.googleFormUrl || "",
    colors: {
      navbar: data.navbar || null,
      primary: data.primary || defaultTheme.colors.primary,
      secondary: data.secondary || defaultTheme.colors.secondary,
      dark: data.dark || defaultTheme.colors.dark,
      darker: data.darker || defaultTheme.colors.darker,
      light: data.light || defaultTheme.colors.light,
    },
  };
}

function applyMeta(theme) {
  document.title = theme.siteName || defaultTheme.siteName;
  if (theme.logo) {
    let link = document.querySelector("link[rel='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = theme.logo;
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    api
      .get("/theme")
      .then(({ data }) => {
        const overrides = buildOverrides(data);
        setTheme(overrides);
        applyColors(overrides.colors);
        applyMeta(overrides);
      })
      .catch(() => {
        applyColors(defaultTheme.colors);
      });
  }, []);

  // Called by AdminSettings after saving theme — updates instantly without reload
  const updateTheme = (fields) => {
    const overrides = buildOverrides({
      siteName: fields.themeSiteName || null,
      logoUrl: fields.themeLogoUrl || null,
      supportPhone: fields.themeSupportPhone || null,
      channelLink: fields.themeChannelLink || null,
      navbar: fields.themeNavbar || null,
      primary: fields.themePrimary || null,
      secondary: fields.themeSecondary || null,
      dark: fields.themeDark || null,
      darker: fields.themeDarker || null,
      light: fields.themeLight || null,
    });
    setTheme(overrides);
    applyColors(overrides.colors);
    applyMeta(overrides);
  };

  return (
    <ThemeContext.Provider value={theme}>
      <ThemeUpdateContext.Provider value={updateTheme}>
        {children}
      </ThemeUpdateContext.Provider>
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
export const useUpdateTheme = () => useContext(ThemeUpdateContext);
