import type { AppState } from '../../types/app-state';

function pushLabeledField(lines: string[], label: string, value: string) {
  if (!value) {
    return;
  }

  lines.push(label);
  lines.push(value);
}

function pushLabeledList(lines: string[], label: string, items: string[]) {
  if (items.length === 0) {
    return;
  }

  lines.push(label);
  for (const item of items) {
    lines.push(`- ${item}`);
  }
}

export function buildLatestCompassContextSection(appState?: AppState): string | null {
  const context = appState?.strategicDashboard.latestCompassAdvisorContext;

  if (!context) {
    return null;
  }

  const lines: string[] = [
    '[LATEST GOLDEN COMPASS CONTEXT]',
    'Use this verbatim context from the latest completed Golden Compass session when it helps you advise me.',
  ];

  const bonfireLines: string[] = [];
  pushLabeledList(bonfireLines, 'What was weighing on me:', context.bonfire.items);
  pushLabeledField(bonfireLines, 'How letting go would feel:', context.bonfire.releaseFeeling);
  pushLabeledList(bonfireLines, 'Three words that describe that release:', context.bonfire.releaseWords);
  if (bonfireLines.length > 0) {
    lines.push('The Bonfire:');
    lines.push(...bonfireLines);
  }

  const pastLines: string[] = [];
  pushLabeledList(pastLines, 'Past highlights from the last 12 months:', context.past.highlights);
  pushLabeledField(pastLines, 'Work life and wealth snapshot:', context.past.yearSnapshot.workLife);
  pushLabeledField(pastLines, 'Relationships, family, and friends snapshot:', context.past.yearSnapshot.relationships);
  pushLabeledField(pastLines, 'Health and fitness snapshot:', context.past.yearSnapshot.health);
  pushLabeledField(pastLines, 'Best thing that happened in the last year:', context.past.bestThing);
  pushLabeledField(pastLines, 'Biggest lesson from the last year:', context.past.biggestLesson);
  pushLabeledField(pastLines, 'What I am proud of:', context.past.proud);
  pushLabeledList(pastLines, 'Three words to describe the past year:', context.past.yearWords);
  pushLabeledField(pastLines, 'Golden moments from the past year:', context.past.goldenMoments);
  pushLabeledList(pastLines, 'Biggest challenges from the last year:', context.past.biggestChallenges);
  pushLabeledField(pastLines, 'What or who helped me through those challenges:', context.past.challengeSupport);
  pushLabeledField(pastLines, 'What those challenges taught me about myself:', context.past.challengeLessons);
  pushLabeledField(pastLines, 'What I am not proud of from the past year:', context.past.notProud);
  pushLabeledField(pastLines, 'What I am ready to forgive myself for:', context.past.selfForgiveness);
  if (pastLines.length > 0) {
    lines.push('The Past:');
    lines.push(...pastLines);
  }

  const futureLines: string[] = [];
  pushLabeledField(futureLines, 'Perfect-day brainstorm for the future:', context.future.perfectDayBrainstorm);
  pushLabeledField(futureLines, 'Next-year focus for work life and wealth:', context.future.nextYearSummary.workLife);
  pushLabeledField(
    futureLines,
    'Next-year focus for relationships, family, and friends:',
    context.future.nextYearSummary.relationships,
  );
  pushLabeledField(futureLines, 'Next-year focus for health and fitness:', context.future.nextYearSummary.health);
  if (futureLines.length > 0) {
    lines.push('The Future:');
    lines.push(...futureLines);
  }

  const perfectDayLines: string[] = [];
  pushLabeledField(perfectDayLines, 'Wake-up time in the perfect day:', context.perfectDay.wakeTime);
  pushLabeledField(perfectDayLines, 'How my body feels in the perfect day:', context.perfectDay.bodyFeeling);
  pushLabeledField(perfectDayLines, 'The first thoughts in my perfect day:', context.perfectDay.firstThoughts);
  pushLabeledField(perfectDayLines, 'What I see when I wake up:', context.perfectDay.morningView);
  pushLabeledField(perfectDayLines, 'Where I am in the perfect day:', context.perfectDay.location);
  pushLabeledField(perfectDayLines, 'The message about yesterday’s wins:', context.perfectDay.salesMessage);
  pushLabeledField(perfectDayLines, 'How autonomy and support feel in that day:', context.perfectDay.autonomyFeeling);
  pushLabeledField(perfectDayLines, 'Work plans in the perfect day:', context.perfectDay.workPlans);
  pushLabeledField(perfectDayLines, 'Fun plans in the perfect day:', context.perfectDay.funPlans);
  pushLabeledField(perfectDayLines, 'What I see in the mirror:', context.perfectDay.mirrorView);
  pushLabeledField(perfectDayLines, 'How I feel about myself in the mirror:', context.perfectDay.selfImageFeeling);
  pushLabeledField(perfectDayLines, 'The outfit for that day:', context.perfectDay.outfit);
  pushLabeledField(perfectDayLines, 'How that outfit feels:', context.perfectDay.outfitFeeling);
  pushLabeledField(perfectDayLines, 'The breakfast that starts the day:', context.perfectDay.breakfast);
  pushLabeledField(perfectDayLines, 'How the day plays out overall:', context.perfectDay.dayNarrative);
  pushLabeledField(perfectDayLines, 'Personal spending account reminder:', context.perfectDay.spendingAccount);
  pushLabeledField(
    perfectDayLines,
    'How financial freedom changes how I feel and act:',
    context.perfectDay.financialFreedomFeeling,
  );
  pushLabeledField(perfectDayLines, 'Charity and impact reminder:', context.perfectDay.charity);
  pushLabeledField(perfectDayLines, 'How I give back to the world:', context.perfectDay.givingBack);
  pushLabeledField(perfectDayLines, 'Weekend trip and company:', context.perfectDay.weekendTrip);
  pushLabeledField(perfectDayLines, 'Weekend activities:', context.perfectDay.weekendActivities);
  pushLabeledField(perfectDayLines, 'Weekend food:', context.perfectDay.weekendFood);
  pushLabeledField(perfectDayLines, 'Home atmosphere:', context.perfectDay.homeAtmosphere);
  pushLabeledField(perfectDayLines, 'View from the window:', context.perfectDay.windowView);
  pushLabeledField(perfectDayLines, 'Cool things in the house:', context.perfectDay.houseHighlights);
  pushLabeledField(perfectDayLines, 'What is in the garage:', context.perfectDay.garageHighlights);
  pushLabeledField(perfectDayLines, 'Message from the special someone:', context.perfectDay.specialSomeoneMessage);
  pushLabeledField(perfectDayLines, 'How the night ends:', context.perfectDay.nightClose);
  pushLabeledList(perfectDayLines, 'Three gratitudes at the end of the day:', context.perfectDay.gratitude);
  pushLabeledField(perfectDayLines, 'How the perfect day makes me feel:', context.perfectDay.compassFeeling);
  if (perfectDayLines.length > 0) {
    lines.push('The Perfect Day:');
    lines.push(...perfectDayLines);
  }

  const lightingLines: string[] = [];
  pushLabeledList(lightingLines, 'Things that make my environment a joy to be in:', context.lightingPath.environmentJoy);
  pushLabeledField(lightingLines, 'Financial support structure:', context.lightingPath.financialSupport);
  pushLabeledField(lightingLines, 'Health support structure:', context.lightingPath.healthSupport);
  pushLabeledField(lightingLines, 'Relationship support structure:', context.lightingPath.relationshipSupport);
  pushLabeledList(lightingLines, 'Things I am ready to let go of:', context.lightingPath.lettingGo);
  pushLabeledList(lightingLines, 'Things I am ready to say no to:', context.lightingPath.sayingNo);
  pushLabeledList(
    lightingLines,
    'Things I will enjoy without guilt:',
    context.lightingPath.guiltFreeEnjoyment,
  );
  pushLabeledList(lightingLines, 'People I will call on during tough times:', context.lightingPath.supportPeople);
  pushLabeledList(lightingLines, 'Places I want to visit this year:', context.lightingPath.placesToVisit);
  pushLabeledList(lightingLines, 'Things I will do for my loved ones:', context.lightingPath.lovedOnes);
  pushLabeledList(lightingLines, 'Rewards I want to buy myself this year:', context.lightingPath.selfRewards);
  if (lightingLines.length > 0) {
    lines.push('Lighting The Path:');
    lines.push(...lightingLines);
  }

  const goldenPathLines: string[] = [];
  pushLabeledField(goldenPathLines, 'Point A - where I am now:', context.goldenPath.pointA);
  pushLabeledField(goldenPathLines, 'Point B - the year I want to build:', context.goldenPath.pointB);
  pushLabeledList(goldenPathLines, 'Major challenges or obstacles on the path:', context.goldenPath.obstacles);
  pushLabeledField(
    goldenPathLines,
    'How I can make the process fun and pleasurable:',
    context.goldenPath.pleasurableProcess,
  );
  pushLabeledField(
    goldenPathLines,
    'Who can help me solve challenges faster and easier:',
    context.goldenPath.fasterHelp,
  );
  pushLabeledField(goldenPathLines, 'Final notes to myself:', context.goldenPath.finalNotes);
  pushLabeledField(goldenPathLines, 'The title of the next year movie:', context.goldenPath.movieTitle);
  pushLabeledField(
    goldenPathLines,
    'Where I think I will be when I open the time-capsule email:',
    context.goldenPath.timeCapsuleLocation,
  );
  pushLabeledField(
    goldenPathLines,
    'How I think I will feel when that email arrives:',
    context.goldenPath.timeCapsuleFeeling,
  );
  if (goldenPathLines.length > 0) {
    lines.push('The Golden Path:');
    lines.push(...goldenPathLines);
  }

  if (lines.length === 2) {
    return null;
  }

  return lines.join('\n');
}
