/** Leaves the app for another site, e.g. a sign-in or consent page that sends the Visitor back. */
export function leaveFor(url: string): void {
  window.location.assign(url);
}
