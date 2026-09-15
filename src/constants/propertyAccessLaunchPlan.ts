export type LaunchPlanStatus = 'now' | 'next' | 'pilot' | 'evidence';

export interface LaunchPlanStep {
  id: string;
  status: LaunchPlanStatus;
  title: string;
  outcome: string;
  definitionOfDone: string;
}

/** The single product path to follow before broad marketing or fundraising. */
export const propertyAccessLaunchPlan: LaunchPlanStep[] = [
  {
    id: 'payments', status: 'now', title: 'Production payments',
    outcome: 'A property can pay for a subscription or card order using a real merchant account.',
    definitionOfDone: 'Merchant API credentials are stored in Secret Manager; checkout, webhook, refund, invoice, and failed-payment tests pass in production.',
  },
  {
    id: 'wallet', status: 'next', title: 'Apple & Google Wallet',
    outcome: 'Residents can add a real access pass to their phone wallet.',
    definitionOfDone: 'PassKit signing certificate and Google Wallet issuer are configured; an active pass can be issued, revoked, and updated from the server.',
  },
  {
    id: 'hardware', status: 'next', title: 'Door-controller integration',
    outcome: 'One selected reader/controller validates NFC and QR credentials through the API.',
    definitionOfDone: 'A test door records granted and denied access, blocks a lost card in under 60 seconds, and has an offline/failure policy.',
  },
  {
    id: 'security', status: 'next', title: 'Deploy & security verification',
    outcome: 'The live Firebase project has the new access controls and audit trail.',
    definitionOfDone: 'Rules, indexes, and Functions are deployed; role tests, API tests, and a recovery drill all pass.',
  },
  {
    id: 'pilot', status: 'pilot', title: 'Paid pilot properties',
    outcome: 'The product is used daily by real residents at 2–5 properties.',
    definitionOfDone: 'Signed pilot agreements, paid subscriptions, named property champions, weekly support review, and consented usage analytics.',
  },
  {
    id: 'traction', status: 'evidence', title: 'Investor evidence',
    outcome: 'A focused property-access story is supported by measured demand.',
    definitionOfDone: 'Report active properties, active residents, monthly recurring revenue, credential activation rate, access success rate, support load, and retention.',
  },
];

export const launchPlanStatusLabel: Record<LaunchPlanStatus, string> = {
  now: 'BUILD NOW', next: 'NEXT', pilot: 'PILOT', evidence: 'PROVE',
};
