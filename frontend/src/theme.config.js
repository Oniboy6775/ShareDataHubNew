// ─────────────────────────────────────────────────────────────────────────────
// AFFILIATE THEME CONFIG
// Values are read from VITE_* env vars at build time (set per Render service).
// Fallbacks below are used when no env var is set.
// ─────────────────────────────────────────────────────────────────────────────
const theme = {
  siteName:        import.meta.env.VITE_SITE_NAME        || "DataHub Affiliate",
  logo:            import.meta.env.VITE_LOGO_PATH        || null,
  supportWhatsapp: import.meta.env.VITE_SUPPORT_WHATSAPP || "2348000000000",

  colors: {
    primary:   import.meta.env.VITE_COLOR_PRIMARY   || "#6366f1",
    secondary: import.meta.env.VITE_COLOR_SECONDARY || "#8b5cf6",
    dark:      import.meta.env.VITE_COLOR_DARK      || "#1a2035",
    darker:    import.meta.env.VITE_COLOR_DARKER    || "#101320",
    light:     import.meta.env.VITE_COLOR_LIGHT     || "#f5f5f5",
  },
};

export default theme;
