import { themeCss } from '@/lib/themes';

/** Injects the selected theme's colour variables (server-rendered, so there is no flash). */
export default function ThemeStyle({ theme }: { theme?: string | null }) {
  return <style id="venora-theme" dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />;
}
