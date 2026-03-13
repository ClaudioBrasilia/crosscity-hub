export const formatDurationInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (!digits) return '';

  if (digits.length <= 2) {
    return `0:${digits.padStart(2, '0')}`;
  }

  const minutes = digits.slice(0, -2).replace(/^0+(?=\d)/, '');
  const seconds = digits.slice(-2);
  return `${minutes || '0'}:${seconds}`;
};

export const getDurationValidationError = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return 'Preencha seu tempo para registrar.';
  if (!/^\d+:[0-5]\d$/.test(trimmedValue)) {
    return 'Tempo inválido. Use o formato m:ss ou mm:ss com segundos entre 00 e 59.';
  }

  return null;
};

export const toDurationSeconds = (value: string) => {
  if (getDurationValidationError(value)) return Number.POSITIVE_INFINITY;

  const [minutes, seconds] = value.split(':').map(Number);
  return minutes * 60 + seconds;
};
