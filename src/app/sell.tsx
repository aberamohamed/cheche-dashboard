import { Redirect } from 'expo-router';

/** Legacy route — Sell lives on the tab navigator with the tab bar hidden. */
export default function SellRedirect() {
  return <Redirect href="/(tabs)/sell" />;
}
