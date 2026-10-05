// Demo world: ten recognisable profiles with interconnected memories, so Recall never launches empty.
import type { Memory, MemoryContext, Person, Relationship } from '../types'

type PersonSeed = Omit<Person, 'createdAt'>
const rel = (name: string, label: string, personId?: string): Relationship => ({ name, label, personId })

const PEOPLE: PersonSeed[] = [
  {
    id: 'jason', name: 'Jason Duval', universe: 'Grand Theft Auto VI', aliases: ['Jason'],
    description: 'Ex-Army, now working around the Leonida Keys and looking for an easier life.',
    tags: ['GTA VI', 'Leonida', 'Vice City', 'Lucia', 'Crime', 'Army'], colors: ['#ff9a6c', '#e0457b'],
    relationships: [rel('Lucia Caminos', 'Partner', 'lucia'), rel('Brian Heder', 'Landlord and employer')],
  },
  {
    id: 'lucia', name: 'Lucia Caminos', universe: 'Grand Theft Auto VI', aliases: ['Lucia'],
    description: 'Recently out of Leonida Penitentiary and determined to build a better life for her family.',
    tags: ['GTA VI', 'Leonida', 'Vice City', 'Jason', 'Family'], colors: ['#c06ad0', '#4568dc'],
    relationships: [rel('Jason Duval', 'Partner', 'jason')],
  },
  {
    id: 'mario', name: 'Mario', universe: 'Super Mario', aliases: ['Mario'],
    description: 'Plumber turned hero of the Mushroom Kingdom; brother to Luigi and friend to Peach.',
    tags: ['Mushroom Kingdom', 'Peach', 'Luigi', 'Racing', 'Adventure'], colors: ['#ff6b6b', '#c81d25'],
    relationships: [rel('Luigi', 'Brother'), rel('Princess Peach', 'Close friend'), rel('Bowser', 'Recurring rival')],
  },
  {
    id: 'lara', name: 'Lara Croft', universe: 'Tomb Raider', aliases: ['Lara'],
    description: 'Archaeologist and explorer who keeps finding herself at the edge of survival.',
    tags: ['Archaeology', 'Exploration', 'Artifacts', 'Expeditions', 'Survival'], colors: ['#5fb3a8', '#1f5f5b'],
    relationships: [rel('Lord Richard Croft', 'Father'), rel('Conrad Roth', 'Mentor'), rel('Jonah Maiava', 'Trusted friend')],
  },
  {
    id: 'kratos', name: 'Kratos', universe: 'God of War', aliases: ['Kratos'],
    description: 'Former Greek god of war, now a father trying to leave rage behind in the Norse realms.',
    tags: ['Atreus', 'Greek mythology', 'Norse mythology', 'Family', 'Past conflicts'], colors: ['#c2524e', '#4a1212'],
    relationships: [rel('Atreus', 'Son'), rel('Faye', 'Late wife'), rel('Mimir', 'Advisor')],
  },
  {
    id: 'peter', name: 'Peter Parker', universe: "Marvel's Spider-Man", aliases: ['Peter', 'Spider-Man', 'Spidey'],
    description: 'Scientist and Spider-Man, balancing New York, relationships and responsibility.',
    tags: ['New York', 'Responsibility', 'Relationships', 'Villains', 'Science'], colors: ['#ef4b4b', '#2b4fbf'],
    relationships: [rel('Mary Jane Watson', 'Partner'), rel('Aunt May', 'Family'), rel('Miles Morales', 'Protégé'), rel('Otto Octavius', 'Former mentor')],
  },
  {
    id: 'arthur', name: 'Arthur Morgan', universe: 'Red Dead Redemption 2', aliases: ['Arthur'],
    description: 'Senior gun in the Van der Linde gang, slowly rethinking what loyalty means.',
    tags: ['Van der Linde gang', 'Dutch', 'Loyalty', 'Redemption', 'Worldview'], colors: ['#d1a871', '#6b4423'],
    relationships: [rel('Dutch van der Linde', 'Leader and father figure'), rel('Hosea Matthews', 'Mentor'), rel('John Marston', 'Brother in arms')],
  },
  {
    id: 'geralt', name: 'Geralt of Rivia', universe: 'The Witcher', aliases: ['Geralt'],
    description: 'Witcher for hire; monster contracts by trade, Ciri and Yennefer by heart.',
    tags: ['Witcher', 'Ciri', 'Yennefer', 'Monsters', 'Contracts'], colors: ['#c3c9d1', '#4a5560'],
    relationships: [rel('Ciri', 'Adopted daughter'), rel('Yennefer', 'Great love'), rel('Vesemir', 'Mentor'), rel('Dandelion', 'Friend')],
  },
  {
    id: 'chief', name: 'Master Chief', universe: 'Halo', aliases: ['Master Chief', 'Chief', 'John-117'],
    description: 'Spartan-II supersoldier of the UNSC, rarely without Cortana.',
    tags: ['UNSC', 'Cortana', 'Spartan program', 'Covenant', 'Missions'], colors: ['#8fb35c', '#2f4a1f'],
    relationships: [rel('Cortana', 'Closest ally'), rel('Dr. Catherine Halsey', 'Creator of the Spartan program')],
  },
  {
    id: 'ellie', name: 'Ellie Williams', universe: 'The Last of Us', aliases: ['Ellie'],
    description: 'Survivor of the outbreak, immune, and shaped by her bond with Joel.',
    tags: ['Survival', 'Joel', 'Immunity', 'Relationships', 'Post-pandemic world'], colors: ['#e6b266', '#4c6b3c'],
    relationships: [rel('Joel', 'Father figure'), rel('Dina', 'Partner')],
  },
]

type Extra = Partial<Pick<Memory, 'places' | 'topics' | 'events' | 'relationships' | 'intent' | 'sentiment' | 'importance' | 'sourceType'>> & { with?: string[] }
const m = (who: string, hoursAgo: number, category: string, text: string, x: Extra = {}) => ({ who, hoursAgo, category, text, x })
const REFLECTIVE = 'Uncertain · reflective'

const MEMORIES = [
  // Jason
  m('jason', 1.5, 'Aspirations', 'Jason wants an easier life, but he keeps getting pulled back in by the people operating around the Leonida Keys.', { places: ['Leonida Keys'], topics: ['Future', 'Crime'], intent: 'Future plan', sentiment: REFLECTIVE, importance: 0.9 }),
  m('jason', 5, 'Relationships', "Lucia is the most important person in Jason's life right now, and most of his decisions run through her.", { with: ['lucia'], topics: ['Relationships', 'Loyalty'], importance: 0.95, sourceType: 'voice' }),
  m('jason', 26, 'Background', 'Jason grew up around grifters and criminals, so that world has always felt normal to him.', { topics: ['Crime'], importance: 0.7 }),
  m('jason', 30, 'Background', 'After a troubled adolescence Jason spent time in the Army, hoping it would straighten things out.', { topics: ['Army'], events: ['Army service'] }),
  m('jason', 52, 'Work', 'Jason ended up working for drug runners around the Leonida Keys. Brian Heder lets him live rent-free as long as he helps out.', { places: ['Leonida Keys'], relationships: ['Brian Heder'], topics: ['Crime'] }),
  m('jason', 75, 'Plans', 'Jason and Lucia agreed that if things go wrong in Vice City, they only have each other to rely on.', { with: ['lucia'], places: ['Vice City'], topics: ['Loyalty', 'Survival'], importance: 0.85 }),
  m('jason', 200, 'Plans', 'Jason and Lucia keep talking about getting out of Leonida once they have enough money put away.', { with: ['lucia'], places: ['Leonida'], topics: ['Future'], intent: 'Future plan', importance: 0.8 }),
  // Lucia
  m('lucia', 3, 'Aspirations', 'Lucia is focused on changing her circumstances and building a better future for herself and her family.', { topics: ['Future', 'Family'], intent: 'Future plan', sentiment: 'Positive', importance: 0.9 }),
  m('lucia', 8, 'Plans', "Jason plays a major role in Lucia's plans. She says she cannot make her next move without him.", { with: ['jason'], topics: ['Future', 'Relationships'], intent: 'Future plan', importance: 0.9 }),
  m('lucia', 28, 'Background', "Lucia's father taught her to fight when she was very young.", { topics: ['Family', 'Mentorship'] }),
  m('lucia', 49, 'Background', 'Fighting for her family is ultimately what landed Lucia in prison.', { topics: ['Family', 'Crime'], events: ['Imprisonment'], sentiment: 'Concerned', importance: 0.75 }),
  m('lucia', 100, 'Places', 'Lucia was incarcerated in Leonida Penitentiary and does not intend to ever go back.', { places: ['Leonida Penitentiary'], topics: ['Crime', 'Survival'] }),
  m('lucia', 150, 'Family', 'Lucia wants the good life her mother has dreamed about since their days in Liberty City.', { places: ['Liberty City'], topics: ['Family', 'Future'], intent: 'Future plan' }),
  // Mario
  m('mario', 6, 'Relationships', 'Mario has rescued Princess Peach from Bowser more times than anyone can count, and he never hesitates.', { relationships: ['Princess Peach', 'Bowser'], places: ['Mushroom Kingdom'], topics: ['Loyalty', 'Adventure'], importance: 0.85 }),
  m('mario', 33, 'Family', 'Mario and his brother Luigi started out as plumbers before the Mushroom Kingdom became home.', { relationships: ['Luigi'], places: ['Mushroom Kingdom'], topics: ['Family'], importance: 0.8 }),
  m('mario', 80, 'Interests', 'Mario takes kart racing seriously. Rainbow Road is his favourite track even though everyone else dreads it.', { places: ['Rainbow Road'], topics: ['Racing'], intent: 'Preference', sentiment: 'Positive' }),
  m('mario', 130, 'Rivals', 'Bowser keeps coming back with a new scheme, and Mario treats it as routine at this point.', { relationships: ['Bowser'], topics: ['Rivalry'] }),
  m('mario', 260, 'Adventures', 'Mario travelled across whole galaxies and kingdoms collecting Power Stars and Moons.', { topics: ['Adventure', 'Exploration'], events: ['Galaxy journey'] }),
  // Lara
  m('lara', 4, 'Work', 'Lara is planning her next expedition around a lead on a lost city in the Peruvian jungle.', { places: ['Peru'], topics: ['Exploration', 'Archaeology'], events: ['Expedition'], intent: 'Future plan', importance: 0.8 }),
  m('lara', 27, 'Background', 'Surviving the shipwreck on Yamatai is what turned Lara from a student into a survivor.', { places: ['Yamatai'], topics: ['Survival'], events: ['Yamatai shipwreck'], importance: 0.85 }),
  m('lara', 60, 'Family', 'Lara is still chasing answers about her father, Lord Richard Croft, and the research he left behind.', { relationships: ['Lord Richard Croft'], places: ['Croft Manor'], topics: ['Family', 'Archaeology'], sentiment: REFLECTIVE }),
  m('lara', 110, 'Mentors', "Conrad Roth was Lara's mentor. He taught her to climb, to hunt and to trust her instincts.", { relationships: ['Conrad Roth'], topics: ['Mentorship', 'Survival'] }),
  m('lara', 180, 'Beliefs', 'Lara believes ancient artifacts belong to history, not to whoever gets there first.', { topics: ['Archaeology', 'Artifacts'], intent: 'Preference' }),
  m('lara', 300, 'Friends', 'Jonah Maiava is the friend Lara trusts most on an expedition; he keeps her grounded.', { relationships: ['Jonah Maiava'], topics: ['Loyalty', 'Exploration'] }),
  // Kratos
  m('kratos', 2, 'Family', 'Kratos is trying to be a better father to Atreus than his own father ever was to him.', { relationships: ['Atreus'], topics: ['Family', 'Redemption'], importance: 0.95, sourceType: 'voice' }),
  m('kratos', 29, 'Journey', "Kratos and Atreus travelled to the highest peak in the realms to scatter Faye's ashes.", { relationships: ['Atreus', 'Faye'], places: ['Jötunheim', 'Midgard'], topics: ['Family', 'Loss'], events: ['Journey to scatter the ashes'], importance: 0.85 }),
  m('kratos', 55, 'Background', 'Kratos was once the Greek god of war and destroyed Olympus in his rage. He rarely speaks about it.', { places: ['Olympus'], topics: ['Greek mythology', 'War'], sentiment: 'Concerned' }),
  m('kratos', 120, 'Past', 'Kratos carries guilt over the family he lost in Greece, and keeps the Blades of Chaos hidden because of it.', { places: ['Greece'], topics: ['Loss', 'Family'], sentiment: 'Concerned' }),
  m('kratos', 170, 'Allies', 'Mimir travels with Kratos as an advisor and is the one who explains the Norse gods to him.', { relationships: ['Mimir'], places: ['Midgard'], topics: ['Norse mythology', 'Mentorship'] }),
  m('kratos', 320, 'Worldview', 'Kratos told Atreus they must be better than the gods who came before them.', { relationships: ['Atreus'], topics: ['Redemption', 'Family'], importance: 0.8 }),
  // Peter
  m('peter', 7, 'Values', 'Peter lives by the lesson Uncle Ben left him: having power means being responsible for how you use it.', { topics: ['Responsibility', 'Family'], importance: 0.9 }),
  m('peter', 31, 'Relationships', 'Peter and Mary Jane Watson are trying to make their relationship work around his double life.', { relationships: ['Mary Jane Watson'], places: ['New York'], topics: ['Relationships'], sentiment: REFLECTIVE }),
  m('peter', 58, 'Family', 'Aunt May raised Peter and ran the F.E.A.S.T. shelter. Losing her changed him.', { relationships: ['Aunt May'], places: ['New York'], topics: ['Family', 'Loss'], importance: 0.85 }),
  m('peter', 90, 'Mentors', "Peter worked in Otto Octavius's lab and looked up to him as a mentor before Otto became Doctor Octopus.", { relationships: ['Otto Octavius'], topics: ['Science', 'Mentorship', 'Villains'] }),
  m('peter', 140, 'Mentoring', 'Peter has been mentoring Miles Morales, teaching him how to handle being Spider-Man.', { relationships: ['Miles Morales'], topics: ['Mentorship', 'Responsibility'] }),
  m('peter', 240, 'Places', 'Peter knows New York rooftop by rooftop and feels responsible for the whole city.', { places: ['New York'], topics: ['Responsibility'] }),
  // Arthur
  m('arthur', 4.5, 'Loyalty', 'Arthur has been questioning his loyalty to Dutch and the direction the gang is heading.', { relationships: ['Dutch van der Linde'], topics: ['Loyalty'], sentiment: REFLECTIVE, importance: 0.95 }),
  m('arthur', 34, 'Background', 'Dutch took Arthur in as a boy and raised him inside the Van der Linde gang. He was the closest thing Arthur had to a father.', { relationships: ['Dutch van der Linde'], topics: ['Family', 'Loyalty', 'Crime'], importance: 0.85 }),
  m('arthur', 70, 'Events', 'After the ferry job in Blackwater went wrong, the gang fled into the mountains and nothing was the same.', { places: ['Blackwater'], events: ['Blackwater ferry job'], topics: ['Crime', 'Survival'] }),
  m('arthur', 115, 'Mentors', 'Hosea Matthews was the steadier mentor to Arthur, teaching him to read people and think before acting.', { relationships: ['Hosea Matthews'], topics: ['Mentorship'] }),
  m('arthur', 160, 'Worldview', 'Since his diagnosis Arthur has been trying to do some good with the time he has left.', { topics: ['Redemption', 'Loss'], sentiment: REFLECTIVE, importance: 0.85 }),
  m('arthur', 280, 'Relationships', 'Arthur urged John Marston to leave the gang and build a real life with his family.', { relationships: ['John Marston'], topics: ['Redemption', 'Family', 'Future'] }),
  // Geralt
  m('geralt', 9, 'Family', 'Geralt thinks of Ciri as his daughter and would cross the Continent to find her.', { relationships: ['Ciri'], places: ['The Continent'], topics: ['Family', 'Loyalty'], importance: 0.95 }),
  m('geralt', 36, 'Relationships', 'Geralt and Yennefer have a complicated, on-and-off relationship that neither of them can walk away from.', { relationships: ['Yennefer'], topics: ['Relationships'], sentiment: REFLECTIVE }),
  m('geralt', 77, 'Work', 'Geralt takes monster contracts for coin and insists on being paid what was agreed.', { topics: ['Monsters', 'Contracts'], intent: 'Preference' }),
  m('geralt', 125, 'Background', 'Geralt was trained as a witcher at Kaer Morhen under Vesemir, who was his mentor and the closest thing to a father.', { relationships: ['Vesemir'], places: ['Kaer Morhen'], topics: ['Mentorship', 'Family', 'Witcher'] }),
  m('geralt', 190, 'Mentoring', 'Geralt trained Ciri at Kaer Morhen and taught her to fight with a sword.', { relationships: ['Ciri'], places: ['Kaer Morhen'], topics: ['Mentorship', 'Family'], importance: 0.8 }),
  m('geralt', 330, 'Friends', 'Dandelion follows Geralt around turning his contracts into ballads, whether Geralt likes it or not.', { relationships: ['Dandelion'], topics: ['Friendship', 'Contracts'] }),
  // Master Chief
  m('chief', 10, 'Relationships', 'Master Chief trusts Cortana more than anyone. She has been in his head through nearly every mission.', { relationships: ['Cortana'], topics: ['Loyalty', 'Missions'], importance: 0.95 }),
  m('chief', 38, 'Background', "Chief was taken into the Spartan-II program as a child and trained by Dr. Catherine Halsey's team.", { relationships: ['Dr. Catherine Halsey'], places: ['Reach'], topics: ['Spartan program', 'Mentorship'] }),
  m('chief', 95, 'Missions', 'Master Chief stopped the Covenant from activating the Halo ring on Installation 04.', { places: ['Installation 04'], topics: ['Covenant', 'Missions', 'War'], events: ['Battle of Installation 04'], importance: 0.85 }),
  m('chief', 165, 'Work', 'Chief serves the UNSC and rarely questions orders, but he went against them to go after Cortana.', { relationships: ['Cortana'], topics: ['UNSC', 'Loyalty'], importance: 0.8 }),
  m('chief', 290, 'Personality', 'Chief says very little and tends to treat impossible odds as just another mission.', { topics: ['Missions'] }),
  // Ellie
  m('ellie', 11, 'Family', 'Joel became a father figure to Ellie on the journey across the country.', { relationships: ['Joel'], topics: ['Family', 'Survival'], importance: 0.95 }),
  m('ellie', 40, 'Background', 'Ellie is immune to the cordyceps infection, and she has struggled with what that was supposed to mean.', { topics: ['Immunity', 'Survival'], sentiment: REFLECTIVE, importance: 0.85 }),
  m('ellie', 85, 'Relationships', 'Ellie and Dina built a life together in Jackson.', { relationships: ['Dina'], places: ['Jackson'], topics: ['Relationships', 'Future'], sentiment: 'Positive' }),
  m('ellie', 135, 'Interests', 'Joel taught Ellie to play guitar, and she still plays the songs he showed her.', { relationships: ['Joel'], topics: ['Mentorship', 'Family', 'Music'] }),
  m('ellie', 210, 'Loss', 'Ellie carries a lot of grief and guilt about Joel and what was left unsaid between them.', { relationships: ['Joel'], topics: ['Loss', 'Family'], sentiment: 'Concerned', importance: 0.85 }),
  m('ellie', 340, 'World', 'Ellie grew up in the Boston quarantine zone and has never known the world before the outbreak.', { places: ['Boston'], topics: ['Survival', 'Post-pandemic world'] }),
]

/** Timestamps are relative to now, so the timeline always has something under "Today". */
export function seedDemo(now = Date.now()): MemoryContext {
  const memories = MEMORIES.map(({ who, hoursAgo, category, text, x: { with: others = [], ...fields } }, i): Memory => ({
    id: `demo-${i}`,
    rawText: text,
    summary: text,
    createdAt: now - hoursAgo * 3_600_000,
    sourceType: 'text',
    category,
    people: [who, ...others],
    places: [],
    topics: [],
    events: [],
    relationships: [],
    intent: 'Fact',
    sentiment: 'Neutral',
    importance: 0.6,
    confidence: 0.92,
    ...fields,
  })).sort((a, b) => b.createdAt - a.createdAt)
  return { people: PEOPLE.map((p) => ({ ...p, createdAt: now - 400 * 3_600_000 })), memories }
}
