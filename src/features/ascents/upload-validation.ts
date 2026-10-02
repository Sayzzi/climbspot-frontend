import { MAXIMUM_GPX_FILE_SIZE, MAXIMUM_NAME_LENGTH } from './domain';
import type { Surface } from '@/shared/domain/values';

export interface UploadValues {
  readonly name: string;
  readonly surface: Surface | undefined;
  readonly gpx: File | undefined;
}

export type UploadField = keyof UploadValues;

export type UploadProblem =
  'nameRequired' | 'nameTooLong' | 'surfaceRequired' | 'fileRequired' | 'fileTooLarge';

/** The API's cheapest rules, checked before sending; the API stays the authority. */
export function findUploadProblems({
  name,
  surface,
  gpx,
}: UploadValues): Partial<Record<UploadField, UploadProblem>> {
  const trimmed = name.trim();
  const nameProblem =
    trimmed === ''
      ? 'nameRequired'
      : trimmed.length > MAXIMUM_NAME_LENGTH
        ? 'nameTooLong'
        : undefined;
  const gpxProblem =
    gpx === undefined
      ? 'fileRequired'
      : gpx.size > MAXIMUM_GPX_FILE_SIZE
        ? 'fileTooLarge'
        : undefined;

  return {
    ...(nameProblem && { name: nameProblem }),
    ...(surface === undefined && { surface: 'surfaceRequired' as const }),
    ...(gpxProblem && { gpx: gpxProblem }),
  };
}
