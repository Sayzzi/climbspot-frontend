import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/** Opens the Flat Pace setting from the header and saves `pace` (min:s). */
export async function setFlatPace(user: UserEvent, pace: string): Promise<void> {
  await user.click(screen.getByRole('button', { name: /^(Set your pace|Flat pace: .+)$/ }));
  const dialog = within(screen.getByRole('dialog', { name: 'Flat pace' }));
  const input = dialog.getByRole('textbox');
  await user.clear(input);
  await user.type(input, pace);
  await user.click(dialog.getByRole('button', { name: 'Save' }));
}
