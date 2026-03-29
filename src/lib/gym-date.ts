export const GYM_TIMEZONE = 'America/Sao_Paulo';

export const getGymDateISO = (date: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: GYM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
