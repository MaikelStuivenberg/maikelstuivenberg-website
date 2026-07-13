export type NavItem = {
  to: string;
  label: string;
};

export const navItems: NavItem[] = [
  { to: "/home", label: "Home" },
  { to: "/privacy", label: "Privacy" },
  { to: "/contact", label: "Contact" },
];
