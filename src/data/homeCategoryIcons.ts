import {
  Boxes,
  Coffee,
  Droplets,
  Gift,
  HeartPulse,
  Leaf,
  Package,
  ShoppingBag,
  Smartphone,
  Tag,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from 'lucide-react-native';

/** Lucide icons aligned with `categoryCardStyles` order for home grid cards. */
const HOME_CATEGORY_ICONS: LucideIcon[] = [
  Boxes,
  Coffee,
  UtensilsCrossed,
  Tag,
  HeartPulse,
  Smartphone,
  Leaf,
  Gift,
  ShoppingBag,
  Droplets,
  Package,
  Wine,
];

export function getHomeCategoryIcon(index: number): LucideIcon {
  return HOME_CATEGORY_ICONS[index % HOME_CATEGORY_ICONS.length];
}
