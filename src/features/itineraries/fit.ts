import {
  Encoder,
  Profile,
  type FileIdMesg,
  type WorkoutMesg,
  type WorkoutStepMesg,
} from '@garmin/fitsdk';

import type { HillSession } from './types';

export const FIT_TYPE = 'application/vnd.ant.fit';

/** What the watch shows for each step, in the Visitor's language. */
export interface WorkoutStepNames {
  readonly warmUp: string;
  readonly repeat: (index: number, count: number) => string;
  readonly recovery: string;
  readonly coolDown: string;
}

/**
 * A Hill Session as a structured FIT workout: Warm-up, then each Repeat and its
 * Recovery, then Cool-down, every step ending at its distance, without targets.
 */
export function toFitWorkout(
  session: HillSession,
  name: string,
  names: WorkoutStepNames,
): Uint8Array<ArrayBuffer> {
  const steps = [
    { name: names.warmUp, metres: session.warmUp.length, intensity: 'warmup' as const },
    ...Array.from({ length: session.repeats }, (_, index) => [
      {
        name: names.repeat(index + 1, session.repeats),
        metres: session.repeat.length,
        intensity: 'active' as const,
      },
      { name: names.recovery, metres: session.repeat.length, intensity: 'recovery' as const },
    ]).flat(),
    { name: names.coolDown, metres: session.warmUp.length, intensity: 'cooldown' as const },
  ];

  const encoder = new Encoder();
  const fileId: FileIdMesg = {
    type: 'workout',
    manufacturer: 'development',
    product: 0,
    timeCreated: new Date(),
  };
  const workout: WorkoutMesg = {
    wktName: name,
    sport: 'running',
    numValidSteps: steps.length,
  };
  encoder.onMesg(message('FILE_ID'), fileId);
  encoder.onMesg(message('WORKOUT'), workout);
  for (const [index, step] of steps.entries()) {
    const workoutStep: WorkoutStepMesg = {
      messageIndex: index,
      wktStepName: step.name,
      durationType: 'distance',
      // The step's distance subfield is written through its main field, in centimetres.
      durationValue: Math.round(step.metres * 100),
      targetType: 'open',
      intensity: step.intensity,
    };
    encoder.onMesg(message('WORKOUT_STEP'), workoutStep);
  }
  // A copy backed by a plain ArrayBuffer, as Blob expects.
  return new Uint8Array(encoder.close());
}

/** The number of a FIT message in the SDK's profile. */
function message(name: 'FILE_ID' | 'WORKOUT' | 'WORKOUT_STEP'): number {
  const number = Profile.MesgNum[name];
  if (number === undefined) {
    throw new Error(`The FIT profile has no ${name} message.`);
  }
  return number;
}
