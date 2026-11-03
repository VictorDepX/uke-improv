/**
 * Ícones do design system (Figma "Uke Improv" · Componentes · Ícones): traço de 2 px em grade de
 * 24 px. Caminhos copiados dos SVGs do arquivo; a cor vem do texto (currentColor), para seguir
 * o tema. Sempre decorativos: quem usa dá o rótulo ao botão.
 */
const PATHS = {
  menu: { d: ['M4 7H20M4 12H20M4 17H20'] },
  mic: {
    d: [
      'M12 3C13.6569 3 15 4.34315 15 6V11C15 12.6569 13.6569 14 12 14C10.3431 14 9 12.6569 9 11V6C9 4.34315 10.3431 3 12 3Z',
      'M5 11C5 12.8565 5.7375 14.637 7.05025 15.9497C8.36301 17.2625 10.1435 18 12 18M12 18C13.8565 18 15.637 17.2625 16.9497 15.9497C18.2625 14.637 19 12.8565 19 11M12 18V21',
    ],
  },
  play: { d: ['M8 5.5V18.5L18.5 12L8 5.5Z'], fill: true },
  stop: { d: ['M17.5 6.5H6.5V17.5H17.5V6.5Z'], fill: true },
  record: {
    d: [
      'M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z',
    ],
    fill: true,
  },
  chevron: { d: ['M6 9L12 15L18 9'] },
  plus: { d: ['M12 5V12M12 12V19M12 12H5M12 12H19'] },
  minus: { d: ['M5 12H19'] },
  close: { d: ['M6 6L12 12M12 12L18 18M12 12L18 6M12 12L6 18'] },
  practice: { d: ['M4 9V4H9M15 4H20V9M20 15V20H15M9 20H4V15'] },
  tuner: {
    d: [
      'M4 18C4 15.8783 4.84285 13.8434 6.34315 12.3431C7.84344 10.8429 9.87827 10 12 10C14.1217 10 16.1566 10.8429 17.6569 12.3431C19.1571 13.8434 20 15.8783 20 18M12 18L16 12',
    ],
  },
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const icon = PATHS[name];
  const fill = 'fill' in icon && icon.fill;
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {icon.d.map((d) => (
        <path
          key={d}
          d={d}
          fill={fill ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
