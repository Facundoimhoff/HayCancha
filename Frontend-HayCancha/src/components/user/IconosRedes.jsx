// Logos de redes sociales (lucide ya no trae marcas). Trazo simple, con el color de cada marca por defecto.

const Base = ({ size = 20, color, children, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
    {...props}
  >
    {children}
  </svg>
);

export const IconoInstagram = ({ color = '#e1306c', ...props }) => (
  <Base color={color} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </Base>
);

export const IconoTikTok = ({ color = '#111827', ...props }) => (
  <Base color={color} {...props}>
    <path d="M21 7.917v4.034a9.948 9.948 0 0 1-5-1.951v4.5a6.5 6.5 0 1 1-8-6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z" />
  </Base>
);

export const IconoFacebook = ({ color = '#1877f2', ...props }) => (
  <Base color={color} {...props}>
    <path d="M7 10v4h3v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3V3h-3a5 5 0 0 0-5 5v2z" />
  </Base>
);
