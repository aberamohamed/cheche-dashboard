import { ShieldCheck } from 'lucide-react-native';
import { ColorValue } from 'react-native';

type WithholdingTabIconProps = {
  color: ColorValue;
  size: number;
};

export function WithholdingTabIcon({ color, size }: WithholdingTabIconProps) {
  return <ShieldCheck size={size} color={String(color)} strokeWidth={2.2} />;
}
