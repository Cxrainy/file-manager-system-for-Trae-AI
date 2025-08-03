// 统一的主题配置
export const theme = {
  // 颜色系统
  colors: {
    // 主色调
    primary: {
      50: 'hsl(221, 83%, 97%)',
      100: 'hsl(221, 83%, 93%)',
      200: 'hsl(221, 83%, 85%)',
      300: 'hsl(221, 83%, 75%)',
      400: 'hsl(221, 83%, 65%)',
      500: 'hsl(221, 83%, 53%)', // 主色
      600: 'hsl(221, 83%, 45%)',
      700: 'hsl(221, 83%, 37%)',
      800: 'hsl(221, 83%, 29%)',
      900: 'hsl(221, 83%, 21%)',
      950: 'hsl(221, 83%, 13%)'
    },

    // 灰色系
    gray: {
      50: 'hsl(210, 40%, 98%)',
      100: 'hsl(210, 40%, 96%)',
      200: 'hsl(210, 40%, 93%)',
      300: 'hsl(210, 40%, 89%)',
      400: 'hsl(210, 40%, 78%)',
      500: 'hsl(210, 40%, 64%)',
      600: 'hsl(210, 40%, 52%)',
      700: 'hsl(210, 40%, 45%)',
      800: 'hsl(210, 40%, 35%)',
      900: 'hsl(210, 40%, 25%)',
      950: 'hsl(210, 40%, 15%)'
    },

    // 语义色
    semantic: {
      success: {
        light: 'hsl(142, 76%, 36%)',
        DEFAULT: 'hsl(142, 71%, 45%)',
        dark: 'hsl(142, 76%, 36%)'
      },
      warning: {
        light: 'hsl(38, 92%, 50%)',
        DEFAULT: 'hsl(25, 95%, 53%)',
        dark: 'hsl(20, 91%, 48%)'
      },
      error: {
        light: 'hsl(0, 84%, 60%)',
        DEFAULT: 'hsl(0, 72%, 51%)',
        dark: 'hsl(0, 74%, 42%)'
      },
      info: {
        light: 'hsl(199, 89%, 48%)',
        DEFAULT: 'hsl(200, 98%, 39%)',
        dark: 'hsl(201, 96%, 32%)'
      }
    }
  },

  // 字体系统
  typography: {
    fontFamily: {
      sans: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'Noto Sans',
        'sans-serif',
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
        'Noto Color Emoji'
      ],
      mono: [
        'JetBrains Mono',
        'Fira Code',
        'Monaco',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'monospace'
      ]
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }]
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    }
  },

  // 间距系统
  spacing: {
    px: '1px',
    0: '0px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem'
  },

  // 圆角系统
  borderRadius: {
    none: '0px',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  },

  // 阴影系统
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none'
  },

  // 断点系统
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  // Z-index 层级
  zIndex: {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modal: '1040',
    popover: '1050',
    tooltip: '1060',
    toast: '1070'
  }
}

// 组件变体
export const componentVariants = {
  button: {
    size: {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 py-2',
      lg: 'h-10 px-8',
      icon: 'h-9 w-9'
    },
    variant: {
      default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
      outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline'
    }
  },
  card: {
    variant: {
      default: 'rounded-lg border bg-card text-card-foreground shadow-sm',
      elevated: 'rounded-lg border bg-card text-card-foreground shadow-md',
      outlined: 'rounded-lg border-2 bg-card text-card-foreground'
    }
  },
  input: {
    variant: {
      default: 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
    }
  }
}

// 导出默认主题
export default theme