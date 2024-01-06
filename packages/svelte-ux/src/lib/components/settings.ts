import type { FormatNumberOptions, FormatNumberStyle } from '$lib/utils/number';
import { getContext, setContext } from 'svelte';
import type { ComponentClasses } from './theme';
import {
  type SettingsDateInput,
  DayOfWeek,
  type DateFormatVariant,
  type CustomIntlDateTimeFormatOptions,
  type OrdinalSuffixes,
  DateToken,
  getWeekStartsOnFromIntl,
} from '$lib/utils/date';

import { createThemeStore, type ThemeStore } from '$lib/stores/themeStore';

type ExcludeNone<T> = T extends 'none' ? never : T;
export type SettingsInput = {
  formats?: {
    numbers?: SettingsNumbersInput;
    dates?: SettingsDateInput;
  };
  classes?: ComponentClasses;
} & SettingsDictionaryInput &
  SettingsThemeInput;

export type Settings = {
  formats?: {
    numbers?: SettingsNumbersInput;
    dates?: SettingsDateInput;
  };
  getFormatNumber: (style?: FormatNumberStyle) => FormatNumberOptions;
  getFormatDate: (input?: SettingsDateInput) => SettingsDate;
  classes: ComponentClasses;
} & SettingsDictionary &
  SettingsTheme;

const settingsKey = Symbol();

export function settings(input: SettingsInput) {
  setContext(settingsKey, {
    formats: {
      numbers: internalGetFormatNumber('currency'),
      dates: internalGetFormatDate(input?.formats?.dates),
    },
    getFormatNumber: internalGetFormatNumber,
    getFormatDate: internalGetFormatDate(input?.formats?.dates),
    classes: input.classes,
    ...themeDefaults({ themes: input.themes, currentTheme: input.currentTheme }),
    ...internalGetDictionary(input),
  });
}

export function getSettings(): Settings {
  // in a try/catch to be able to test wo svelte components
  try {
    return getContext<Settings>(settingsKey) ?? {};
  } catch (error) {
    // get default defaults and that's it.
    return {
      getFormatNumber: internalGetFormatNumber,
      getFormatDate: internalGetFormatDate,
      classes: {},
      ...themeDefaults({}),
      ...internalGetDictionary({}),
    };
  }
}

/**
 * Theme part
 */

type SettingsThemeInput = {
  themes?: {
    light?: string[];
    dark?: string[];
  };
  currentTheme?: ThemeStore;
};

type SettingsTheme = {
  themes: {
    light: string[];
    dark: string[];
  };
  currentTheme: ThemeStore;
};

function themeDefaults(input: SettingsThemeInput): SettingsTheme {
  let lightThemes = input.themes?.light ?? ['light'];
  let darkThemes = input.themes?.dark ?? ['dark'];

  let currentTheme =
    // In some cases, `settings` is called again from inside a component. Don't create a new theme store in this case.
    input.currentTheme ??
    createThemeStore({
      light: lightThemes,
      dark: darkThemes,
    });

  return {
    themes: {
      light: lightThemes,
      dark: darkThemes,
    },
    currentTheme,
  };
}

/**
 * Number part
 */

type SettingsNumbersInput = {
  defaults?: FormatNumberOptions;
} & {
  [key in ExcludeNone<FormatNumberStyle>]?: FormatNumberOptions;
};

type SettingsNumbers = {
  defaults: FormatNumberOptions;
} & {
  [key in ExcludeNone<FormatNumberStyle>]?: FormatNumberOptions;
};

function numbersDefaults(input: SettingsNumbersInput): SettingsNumbers {
  let toRet: SettingsNumbers = {
    defaults: {
      locales: 'en',
      currency: 'USD',
      fractionDigits: 2,
      currencyDisplay: 'symbol',
    },
  };

  //TODO?

  return toRet;
}

function internalGetFormatNumber(style?: FormatNumberStyle): FormatNumberOptions {
  return numbersDefaults({})['defaults'];

  // TODO?

  // toRet = { ...toRet, ...(settings.formats?.numbers?.defaults ?? {}) };

  // if (style && style !== 'none') {
  //   toRet = { ...toRet, ...(settings.formats?.numbers?.[style] ?? {}) };
  // }
}

/**
 * Dictionary part
 */

export type SettingsDictionaryInput = {
  dictionary?: {
    Ok?: string;
    Cancel?: string;

    Date?: {
      Day?: string;
      Week?: string;
      BiWeek?: string;
      Month?: string;
      Quarter?: string;
      CalendarYear?: string;
      FiscalYearOct?: string;
    };
  };
};

type DeepRequired<T> = Required<{
  [K in keyof T]: T[K] extends Required<T[K]> ? Required<T[K]> : DeepRequired<T[K]>;
}>;

export type SettingsDictionary = DeepRequired<SettingsDictionaryInput>;

function dictionaryDefaults(): SettingsDictionary {
  return {
    dictionary: {
      Ok: 'Ok',
      Cancel: 'Cancel',

      Date: {
        Day: 'Day',
        Week: 'Week',
        BiWeek: 'Bi-Week',
        Month: 'Month',
        Quarter: 'Quarter',
        CalendarYear: 'Calendar Year',
        FiscalYearOct: 'Fiscal Year (Oct)',
      },
    },
  };
}

function internalGetDictionary(input: SettingsDictionaryInput) {
  // if custom is set && variant is not set, let's put custom as variant
  const def = dictionaryDefaults();

  let toRet: SettingsDictionary = {
    dictionary: {
      Ok: input?.dictionary?.Ok ?? def.dictionary.Ok,
      Cancel: input?.dictionary?.Cancel ?? def.dictionary.Cancel,

      Date: {
        Day: input?.dictionary?.Date?.Day ?? def.dictionary.Date.Day,
        Week: input?.dictionary?.Date?.Week ?? def.dictionary.Date.Week,
        BiWeek: input?.dictionary?.Date?.BiWeek ?? def.dictionary.Date.BiWeek,
        Month: input?.dictionary?.Date?.Month ?? def.dictionary.Date.Month,
        Quarter: input?.dictionary?.Date?.Quarter ?? def.dictionary.Date.Quarter,
        CalendarYear: input?.dictionary?.Date?.CalendarYear ?? def.dictionary.Date.CalendarYear,
        FiscalYearOct: input?.dictionary?.Date?.FiscalYearOct ?? def.dictionary.Date.FiscalYearOct,
      },
    },
  };

  return toRet;
}

type SettingsDate = {
  locales: string;
  baseParsing: string;
  weekStartsOn: DayOfWeek;
  variant: DateFormatVariant;
  custom: CustomIntlDateTimeFormatOptions;
  presets: {
    day: Record<DateFormatVariant, CustomIntlDateTimeFormatOptions>;
    dayTime: Record<DateFormatVariant, CustomIntlDateTimeFormatOptions>;
    timeOnly: Record<DateFormatVariant, CustomIntlDateTimeFormatOptions>;
    week: Record<DateFormatVariant, CustomIntlDateTimeFormatOptions>;
    month: Record<DateFormatVariant, CustomIntlDateTimeFormatOptions>;
    monthYear: Record<DateFormatVariant, CustomIntlDateTimeFormatOptions>;
    year: Record<DateFormatVariant, CustomIntlDateTimeFormatOptions>;
  };
  ordinalSuffixes: Record<string, OrdinalSuffixes>;
  dictionaryDate: SettingsDictionary['dictionary']['Date'];
};

function dateDefaults(localesInput?: string): SettingsDate {
  const locales = localesInput ?? 'en';

  const custom = '';
  return {
    baseParsing: 'yyyy-MM-dd',
    custom: '',
    locales,
    weekStartsOn: getWeekStartsOnFromIntl(locales) ?? DayOfWeek.Sunday,
    variant: 'default',
    ordinalSuffixes: {
      en: {
        one: 'st',
        two: 'nd',
        few: 'rd',
        other: 'th',
      },
    },
    dictionaryDate: internalGetDictionary({}).dictionary.Date,
    presets: {
      day: {
        short: [DateToken.DayOfMonth_numeric, DateToken.Month_numeric],
        default: [DateToken.DayOfMonth_numeric, DateToken.Month_numeric, DateToken.Year_numeric],
        long: [DateToken.DayOfMonth_numeric, DateToken.Month_short, DateToken.Year_numeric],
        custom,
      },

      dayTime: {
        short: [
          DateToken.DayOfMonth_numeric,
          DateToken.Month_numeric,
          DateToken.Year_numeric,
          DateToken.Hour_numeric,
          DateToken.Minute_numeric,
        ],
        default: [
          DateToken.DayOfMonth_numeric,
          DateToken.Month_numeric,
          DateToken.Year_numeric,
          DateToken.Hour_2Digit,
          DateToken.Minute_2Digit,
        ],
        long: [
          DateToken.DayOfMonth_numeric,
          DateToken.Month_numeric,
          DateToken.Year_numeric,
          DateToken.Hour_2Digit,
          DateToken.Minute_2Digit,
          DateToken.Second_2Digit,
        ],
        custom,
      },

      timeOnly: {
        short: [DateToken.Hour_numeric, DateToken.Minute_numeric],
        default: [DateToken.Hour_2Digit, DateToken.Minute_2Digit, DateToken.Second_2Digit],
        long: [
          DateToken.Hour_2Digit,
          DateToken.Minute_2Digit,
          DateToken.Second_2Digit,
          DateToken.MiliSecond_3,
        ],
        custom,
      },

      week: {
        short: [DateToken.DayOfMonth_numeric, DateToken.Month_numeric],
        default: [DateToken.DayOfMonth_numeric, DateToken.Month_numeric, DateToken.Year_numeric],
        long: [DateToken.DayOfMonth_numeric, DateToken.Month_numeric, DateToken.Year_numeric],
        custom,
      },

      month: {
        short: DateToken.Month_short,
        default: DateToken.Month_short,
        long: DateToken.Month_long,
        custom,
      },

      monthYear: {
        short: [DateToken.Month_short, DateToken.Year_2Digit],
        default: [DateToken.Month_long, DateToken.Year_numeric],
        long: [DateToken.Month_long, DateToken.Year_numeric],
        custom,
      },

      year: {
        short: DateToken.Year_2Digit,
        default: DateToken.Year_numeric,
        long: DateToken.Year_numeric,
        custom,
      },
    },
  };
}

function internalGetFormatDate(input?: SettingsDateInput): SettingsDate {
  // if custom is set && variant is not set, let's put custom as variant
  const variant: SettingsDateInput['variant'] =
    input?.custom && input?.variant === undefined ? 'custom' : input?.variant ?? 'default';

  const def = dateDefaults(input?.locales);

  const baseParsing = input?.baseParsing ?? def.baseParsing;

  const custom = input?.custom ?? '';

  // const locales = input?.locales ?? def.locales;

  let toRet: SettingsDate = {
    locales: def.locales,
    baseParsing,
    weekStartsOn: input?.weekStartsOn ?? def.weekStartsOn ?? getWeekStartsOnFromIntl(def.locales),
    variant,
    custom,

    // keep always the en fallback
    ordinalSuffixes: {
      ...def.ordinalSuffixes,
      ...input?.ordinalSuffixes,
    },

    presets: {
      day: {
        short: input?.presets?.day?.short ?? def.presets.day.short,
        default: input?.presets?.day?.default ?? def.presets.day.default,
        long: input?.presets?.day?.long ?? def.presets.day.long,
        custom,
      },
      dayTime: {
        short: input?.presets?.dayTime?.short ?? def.presets.dayTime.short,
        default: input?.presets?.dayTime?.default ?? def.presets.dayTime.default,
        long: input?.presets?.dayTime?.long ?? def.presets.dayTime.long,
        custom,
      },

      timeOnly: {
        short: input?.presets?.timeOnly?.short ?? def.presets.timeOnly.short,
        default: input?.presets?.timeOnly?.default ?? def.presets.timeOnly.default,
        long: input?.presets?.timeOnly?.long ?? def.presets.timeOnly.long,
        custom,
      },

      week: {
        short: input?.presets?.week?.short ?? def.presets.week.short,
        default: input?.presets?.week?.default ?? def.presets.week.default,
        long: input?.presets?.week?.long ?? def.presets.week.long,
        custom,
      },
      month: {
        short: input?.presets?.month?.short ?? def.presets.month.short,
        default: input?.presets?.month?.default ?? def.presets.month.default,
        long: input?.presets?.month?.long ?? def.presets.month.long,
        custom,
      },
      monthYear: {
        short: input?.presets?.monthsYear?.short ?? def.presets.monthYear.short,
        default: input?.presets?.monthsYear?.default ?? def.presets.monthYear.default,
        long: input?.presets?.monthsYear?.long ?? def.presets.monthYear.long,
        custom,
      },
      year: {
        short: input?.presets?.year?.short ?? def.presets.year.short,
        default: input?.presets?.year?.default ?? def.presets.year.default,
        long: input?.presets?.year?.long ?? def.presets.year.long,
        custom,
      },
    },

    // dico
    dictionaryDate: internalGetDictionary({}).dictionary.Date,
  };

  return toRet;
}
