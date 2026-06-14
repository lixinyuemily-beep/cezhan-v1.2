export const C_LIGHT = {
  bgPrimary:       "#F7F5F0",
  bgSecondary:     "#FFFFFF",
  bgSidebar:       "#1C1C1E",
  accentPrimary:   "#2B5F8E",
  accentSecondary: "#C8873A",
  textPrimary:     "#1C1C1E",
  textSecondary:   "#6B6B6B",
  textPlaceholder: "#ADADAD",
  border:          "#E0DDD6",
  aiGenerated:     "#EEF4FB",
  humanEdited:     "#FDF6EC",
  warning:         "#D97706",
  success:         "#2D7D52",
  stepInactive:    "#D1CFC9",
  sliderTrack:     "#E0DDD6",
  sliderThumb:     "#2B5F8E",
  hoverBg:         "#F5F5F5",
};

export const C_DARK = {
  bgPrimary:       "#1C1C1E",
  bgSecondary:     "#2C2C2E",
  bgSidebar:       "#000000",
  accentPrimary:   "#4A90D9",
  accentSecondary: "#D4A056",
  textPrimary:     "#FFFFFF",
  textSecondary:   "#A0A0A0",
  textPlaceholder: "#666666",
  border:          "#3A3A3C",
  aiGenerated:     "#1E3A5F",
  humanEdited:     "#3D2E1E",
  warning:         "#E5A733",
  success:         "#3D9D6A",
  stepInactive:    "#4A4A4A",
  sliderTrack:     "#3A3A3C",
  sliderThumb:     "#4A90D9",
  hoverBg:         "#3A3A3C",
};

export const getTheme = (isDark) => isDark ? C_DARK : C_LIGHT;

export const C = C_LIGHT;

export const STEPS = ["叙事方向", "单元结构", "展品推荐", "策展文本", "完整大纲"];
