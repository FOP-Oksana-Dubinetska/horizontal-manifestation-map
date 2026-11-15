import en from '../../../locales/en.json' with { type: 'json' };
import uk from '../../../locales/uk.json' with { type: 'json' };
import ru from '../../../locales/ru.json' with { type: 'json' };

export const localeResources = { en, uk, ru };
export type Locale = keyof typeof localeResources;
export type MessageKey = keyof typeof en.ui | keyof typeof en.host;
export const isLocale = (value: unknown): value is Locale =>
	value === 'en' || value === 'uk' || value === 'ru';
export function createTranslator(getLanguage: () => Locale) {
	return (key: MessageKey): string => {
		const copy = localeResources[getLanguage()];
		return (
			(copy.ui as Record<string, string>)[key] ?? (copy.host as Record<string, string>)[key] ?? key
		);
	};
}
