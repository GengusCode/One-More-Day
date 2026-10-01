import { STORY_EVENTS, STORY_WORK_DECISIONS } from "./story-events.js";
import { ROUTINE_EVENTS } from "./routine-events.js";
const choice = (id, label, result, effects = {}, extra = {}) => ({ id, label, result, effects, ...extra });

const EVERYDAY_EVENTS = [
  {
    id: "first-payday-plan", deck: "money", icon: "💳", kicker: "STARTING OUT",
    title: "Your friends are planning a payday shopping trip.",
    text: "You are still finding your feet. They want company, and the shops want your whole balance.",
    eligibility: { maxAge: 29 },
    choices: [
      choice("browse-only", "Go along and stick to browsing", "You enjoy the company without buying a new problem.", { stats: { social: 4, knowledge: 2 } }),
      choice("buy-treat", "Set R90 aside for a treat", "One small purchase feels better than spending everything.", { cash: -90, stats: { happiness: 5 } }),
      choice("plan-at-home", "Stay home and plan your money", "A clear plan makes the next payday less mysterious.", { stats: { knowledge: 6, energy: 3, social: -2 } }),
    ],
  },
  {
    id: "old-classmate-course", deck: "opportunity", icon: "📚", kicker: "AFTER SCHOOL",
    title: "A classmate shares a free evening course.",
    text: "It starts tonight. You could learn something useful, but you are tired from the day.",
    eligibility: { maxAge: 29 },
    choices: [
      choice("attend-course", "Take the first class", "You leave tired, with notes you can actually use.", { stats: { knowledge: 7, energy: -8 }, relationships: { classmate: 4 } }),
      choice("study-together", "Ask to study together later", "A familiar face makes learning feel possible.", { stats: { knowledge: 3, social: 3 }, relationships: { classmate: 5 } }),
      choice("rest-tonight", "Rest tonight", "There is no certificate for exhaustion. You catch up on sleep.", { stats: { energy: 10, happiness: 2 } }),
    ],
  },
  {
    id: "weekend-market-shift", deck: "opportunity", icon: "🥬", kicker: "PAID SIDE JOB",
    title: "A market trader needs help for the morning.",
    text: "There are crates to unpack and customers to serve. The pay is agreed before you start.",
    eligibility: { weekend: true, maxAge: 59 },
    choices: [
      choice("full-market-shift", "Work the morning for R120", "You unpack, serve and clean up. The trader pays the agreed R120.", { cash: 120, stats: { energy: -14, reputation: 3 } }),
      choice("short-market-shift", "Do two hours for R60", "You earn R60 for unloading and keep the afternoon free.", { cash: 60, stats: { energy: -7 } }),
      choice("decline-market", "Keep your day off", "Your wallet stays where it was. Your body gets a break.", { stats: { energy: 9, happiness: 3 } }),
    ],
  },
  {
    id: "weekend-poster-job", deck: "opportunity", icon: "🎨", kicker: "SMALL COMMISSION",
    title: "A local takeaway needs a new menu poster.",
    text: "The owner offers R100 for a finished design, or R40 to help check the wording.",
    eligibility: { weekend: true },
    choices: [
      choice("design-poster", "Make the poster for R100", "You deliver the artwork, make one revision and collect R100.", { cash: 100, stats: { energy: -10, knowledge: 3 } }),
      choice("check-menu", "Proofread the menu for R40", "You catch two wrong prices and earn the agreed R40.", { cash: 40, stats: { energy: -4, reputation: 2 } }),
      choice("refer-designer", "Recommend someone else", "The owner gets a contact. You keep your weekend.", { stats: { social: 3 }, relationships: { neighbour: 3 } }),
    ],
  },
  {
    id: "water-off", deck: "community", icon: "🚰", kicker: "EMPTY TAPS",
    title: "The water is off and nobody knows for how long.",
    text: "A neighbour has spare containers. The shop still has bottled water, at a price.",
    choices: [
      choice("share-water", "Collect water with the neighbours", "You carry your share and help with theirs.", { stats: { energy: -7, social: 4 }, relationships: { neighbour: 5 } }),
      choice("buy-water", "Buy R35 of drinking water", "You cover the basics and save your energy.", { cash: -35, stats: { happiness: 2 } }),
      choice("use-reserves", "Use your reserve carefully", "You make it last and learn what to store next time.", { stats: { knowledge: 4, happiness: -2 } }),
    ],
  },
  {
    id: "friend-hard-day", deck: "relationships", icon: "☕", kicker: "A QUIET MESSAGE",
    title: "Your friend asks if you have a minute.",
    text: "The voice note is unusually short. Something has gone wrong, and they need someone to listen.",
    choices: [
      choice("listen-friend", "Make time for a proper call", "You cannot solve it all, but they no longer feel alone.", { stats: { energy: -4, social: 4 }, relationships: { friend: 8 } }),
      choice("coffee-friend", "Meet for a R30 coffee", "A quiet table makes a difficult conversation easier.", { cash: -30, stats: { happiness: 4 }, relationships: { friend: 6 } }),
      choice("message-later", "Explain you need to rest first", "You set a boundary and send a thoughtful reply later.", { stats: { energy: 6 }, relationships: { friend: 1 } }),
    ],
  },
  {
    id: "resell-listing", deck: "owner", icon: "📸", kicker: "SELL WHAT YOU HAVE",
    title: "An item has sat on your shelf all week.",
    text: "Buyers keep asking for photos. You can improve the listing, offer a discount, or wait.",
    eligibility: { businessId: "buy-resell" },
    choices: [
      choice("retake-photos", "Take clear photos and measurements", "The listing answers questions before buyers ask them.", { stats: { knowledge: 4, energy: -5 }, business: { trust: 5 } }),
      choice("discount-stock", "Offer a R40 discount", "You give up R40 of margin to help move the stock.", { cash: -40, business: { trust: 2 } }),
      choice("wait-stock", "Keep the current price", "You hold your margin and accept a slower sale.", { stats: { happiness: -2 } }),
    ],
  },
  {
    id: "office-learning", deck: "corporate", icon: "🖥️", kicker: "ON THE CLOCK",
    title: "The team switches to software nobody knows yet.",
    text: "Your normal shift is paid. What matters now is how you handle the learning curve.",
    eligibility: { career: true },
    choices: [
      choice("learn-tool", "Work through the tutorial", "You solve tomorrow's problem before it arrives.", { stats: { knowledge: 6, energy: -5 }, career: { readiness: 4 } }),
      choice("share-notes", "Learn with a co-worker", "Two sets of notes keep the team moving.", { stats: { knowledge: 3, social: 3 }, career: { coworkers: 5 } }),
      choice("old-process", "Keep using the old process", "It is comfortable today and harder to defend tomorrow.", { career: { performance: -3, readiness: -2 } }),
    ],
  },
  {
    id: "later-life-mentor", deck: "community", icon: "🌱", kicker: "EXPERIENCE COUNTS",
    title: "Someone younger asks how you kept going.",
    text: "They are starting a small venture and want advice from somebody who has lived a little.",
    eligibility: { minAge: 60 },
    choices: [
      choice("share-lessons", "Share the mistakes as well as the wins", "Your honest advice helps them see the work ahead.", { stats: { reputation: 6, happiness: 4, energy: -3 } }),
      choice("make-introduction", "Introduce them to a useful contact", "You open a door and let them do the walking.", { stats: { social: 5, reputation: 3 } }),
      choice("quiet-day", "Wish them well and keep a quiet day", "You are allowed to enjoy your own time too.", { stats: { energy: 8, happiness: 3 } }),
    ],
  },
  {
    id: "later-life-pace", deck: "relationships", icon: "🌊", kicker: "A DIFFERENT RHYTHM",
    title: "Your people invite you out for an afternoon by the sea.",
    text: "There is no deadline. You can take a short walk, sit together, or enjoy home.",
    eligibility: { minAge: 60, weekend: true },
    choices: [
      choice("seaside-walk", "Take a gentle walk together", "Fresh air and familiar voices make a good afternoon.", { stats: { health: 4, happiness: 6, energy: -4 }, relationships: { friend: 4 } }),
      choice("seaside-lunch", "Share a R65 lunch", "Nobody rushes the conversation.", { cash: -65, stats: { happiness: 7, social: 3 } }),
      choice("home-afternoon", "Spend a peaceful afternoon at home", "Rest can be a worthwhile plan all by itself.", { stats: { energy: 10, happiness: 3 } }),
    ],
  },
];

export const EVENTS = Object.freeze([
  ...ROUTINE_EVENTS,
  ...EVERYDAY_EVENTS,
  ...STORY_EVENTS,
  {
    id: "taxi-full", deck: "transport", icon: "🚐", kicker: "MORNING RUSH",
    title: "The taxi is full. The conductor says there is space.",
    text: "There is no seat, only a narrow passage and a clock that refuses to wait.",
    eligibility: { travel: true },
    choices: [
      choice("stand-passage", "Squeeze into the passage", "", {}, {
        followUp: {
          title: "The conductor waves you in",
          text: "Your bag has to go somewhere. What do you do?",
          choices: [
            choice("bag-lap", "Hold it against your chest", "You arrive folded in half, but on time.", { cash: -30, stats: { energy: -12, happiness: -5 } }),
            choice("bag-boot", "Risk putting it in the boot", "You arrive on time after checking the boot twice.", { cash: -30, stats: { energy: -10, happiness: -4 } }),
          ],
        },
      }),
      choice("wait", "Wait for the next one", "The next taxi has a seat, but the delay follows you into work.", { cash: -30, stats: { energy: -3 }, flags: { late: true } }),
      choice("other-ride", "Find another way", "You step out of the queue and price your options.", {}, { flags: { travelDecision: true } }),
    ],
  },
  {
    id: "taxi-flat-tyre", deck: "transport", icon: "🛞", kicker: "SIDE OF THE ROAD",
    title: "A tyre gives up before the taxi does.",
    text: "The driver opens the boot. Everyone checks the time at once.",
    eligibility: { travel: true },
    choices: [
      choice("help-wheel", "Help change it", "Your sleeves suffer, but the taxi moves again.", { stats: { energy: -7, reputation: 5 } }),
      choice("wait-wheel", "Wait and keep your place", "You save money and lose time.", { stats: { energy: -2 }, flags: { late: true } }),
      choice("switch-wheel", "Arrange another ride", "You decide reliability is worth paying for today.", {}, { flags: { travelDecision: true } }),
    ],
  },
  {
    id: "taxi-breakdown", deck: "transport", icon: "🧰", kicker: "NOT GOING ANYWHERE",
    title: "The Quantum coughs, shudders and rolls to a stop.",
    text: "The driver says it will be five minutes. Nobody believes five minutes.",
    eligibility: { travel: true },
    choices: [
      choice("call-ahead", "Call ahead while you wait", "The delay still hurts, but the warning helps.", { stats: { reputation: 2 }, flags: { lateCalled: true } }),
      choice("switch-breakdown", "Leave and find another ride", "You protect your time and open your wallet.", {}, { flags: { travelDecision: true } }),
      choice("stay-breakdown", "Accept that today changed", "You stop fighting the delay and rethink the day.", {}, { flags: { stayHomePrompt: true } }),
    ],
  },
  {
    id: "taxi-strike", deck: "transport", icon: "✋", kicker: "NO TAXIS TODAY",
    title: "The rank is silent.",
    text: "A strike has taken the usual route off the board. E-hailing prices are already climbing.",
    eligibility: { travel: true },
    choices: [
      choice("check-options", "Check every way to work", "You compare cost, comfort and what you already own.", {}, { flags: { travelDecision: true, taxiStrike: true } }),
      choice("call-work", "Call work before deciding", "At least nobody is wondering where you are.", { stats: { reputation: 2 }, flags: { travelDecision: true, taxiStrike: true, calledAhead: true } }),
      choice("stay-strike", "Stay home", "You trade income and trust for a day without the commute.", {}, { flags: { stayHomePrompt: true, taxiStrike: true } }),
    ],
  },
  {
    id: "ehailing-surge", deck: "transport", icon: "📱", kicker: "SURGE PRICING",
    title: "The fare jumps while you are looking at it.",
    text: "The app knows everyone needs a ride at the same time.",
    eligibility: { travel: true },
    choices: [
      choice("book-surge", "Book before it jumps again", "The ride comes quickly. Your balance feels it.", { flags: { forceTravel: "ehailing-surge" } }),
      choice("compare-surge", "Compare your other options", "You refuse to let urgency make the whole decision.", {}, { flags: { travelDecision: true } }),
      choice("message-surge", "Message the group chat", "Three voice notes later, you may have a lift.", { stats: { social: 3 }, relationships: { friend: 3 } }),
    ],
  },
  {
    id: "loadshedding-deadline", deck: "community", icon: "💡", kicker: "THE POWER GOES",
    title: "The lights cut out with work still due.",
    text: "Someone nearby has a charged laptop, somebody else has a gas stove, and everyone has advice.",
    choices: [
      choice("borrow-power", "Ask around for power", "", {}, { followUp: {
        title: "Two neighbours answer",
        text: "One has backup power. The other needs help in return.",
        choices: [
          choice("swap-favour", "Trade a favour", "The work gets done and the favour enters the neighbourhood ledger.", { stats: { reputation: 5, energy: -5 }, relationships: { neighbour: 7 } }),
          choice("pay-charge", "Pay to charge nearby", "You protect the deadline without owing anybody.", { cash: -45, stats: { knowledge: 2 } }),
        ],
      } }),
      choice("work-offline", "Do what you can offline", "A notebook and a torch keep the idea alive.", { stats: { knowledge: 5, energy: -6 } }),
      choice("leave-it", "Accept the interruption", "The rest helps. The deadline does not.", { stats: { energy: 8, reputation: -4 } }),
    ],
  },
  {
    id: "stokvel-pressure", deck: "money", icon: "🤝", kicker: "THE GROUP IS COUNTING",
    title: "This month’s stokvel contribution is still outstanding.",
    text: "Skipping saves cash now, but everybody notices who carries the group.",
    choices: [
      choice("pay-stokvel", "Make the contribution", "", {}, { followUp: {
        title: "Your cash is tight",
        text: "Do you use savings or make a smaller honest offer?",
        choices: [
          choice("full-stokvel", "Pay the full amount", "The group knows your word means something.", { stats: { reputation: 6, happiness: 2 }, relationships: { friend: 5 } }),
          choice("partial-stokvel", "Explain and pay part", "Honesty keeps the relationship warmer than silence would.", { stats: { reputation: 2 }, relationships: { friend: 2 } }),
        ],
      } }),
      choice("skip-stokvel", "Keep quiet this month", "Your cash survives. The group chat goes cold.", { stats: { reputation: -6 }, relationships: { friend: -7 } }),
      choice("offer-help", "Offer time instead of cash", "You spend Saturday helping with the books.", { stats: { knowledge: 4, energy: -7 }, relationships: { friend: 4 } }),
    ],
  },
  {
    id: "braai-invite", deck: "relationships", icon: "🔥", kicker: "SATURDAY PLANS",
    title: "The braai starts just as your energy runs out.",
    text: "Your people want you there. Your body wants the couch.",
    eligibility: { weekend: true },
    choices: [
      choice("bring-rolls", "Go and bring the rolls", "You arrive useful and leave with three new stories.", { cash: -55, stats: { social: 8, happiness: 7, energy: -5 }, relationships: { friend: 7 } }),
      choice("show-late", "Rest first, arrive late", "You miss the opening gossip but save the evening.", { stats: { social: 4, happiness: 5, energy: 2 }, relationships: { friend: 3 } }),
      choice("stay-couch", "Stay on the couch", "The quiet is good. The missed photo lands in the group chat.", { stats: { energy: 12, social: -3 }, relationships: { friend: -2 } }),
    ],
  },
  {
    id: "gogo-groceries", deck: "relationships", icon: "🛍️", kicker: "FAMILY CALL",
    title: "Gogo needs groceries carried home.",
    text: "It will take the afternoon, and she has already told everyone you are coming.",
    choices: [
      choice("help-gogo", "Go help properly", "You lose an afternoon and gain a full plate.", { cash: -70, stats: { energy: -8, happiness: 6, reputation: 5 }, relationships: { gogo: 10 } }, { delayed: { days: 5, outcomeId: "gogo-support", severity: 1, result: "Gogo remembers your help and brings a meal when you are tired.", effects: { stats: { energy: 8, happiness: 4 } } } }),
      choice("send-groceries", "Pay for delivery", "The groceries arrive before your apology does.", { cash: -120, relationships: { gogo: 3 } }),
      choice("promise-later", "Promise to come tomorrow", "Tomorrow now has an appointment.", { relationships: { gogo: -3 } }, { delayed: { days: 1, outcomeId: "gogo-reminder", severity: 2, result: "You missed Gogo’s visit; she feels forgotten.", effects: { relationships: { gogo: -5 }, stats: { happiness: -2 } } } }),
    ],
  },
  {
    id: "derby-conversation", deck: "community", icon: "⚽", kicker: "EVERYBODY HAS AN OPINION",
    title: "The room splits over the weekend fixture.",
    text: "You can talk football, change the subject, or admit you did not watch.",
    choices: [
      choice("join-debate", "Defend your side", "The debate gets loud and somehow ends in laughter.", { stats: { social: 6, happiness: 4 } }),
      choice("ask-questions", "Let the experts explain", "You learn more about people than the match.", { stats: { knowledge: 3, social: 4 } }),
      choice("skip-sport", "Talk about something else", "Two people are relieved. One person is offended.", { stats: { reputation: 1 } }),
    ],
  },
  {
    id: "spaza-credit", deck: "money", icon: "🥖", kicker: "PAYDAY IS CLOSE",
    title: "The spaza owner offers to write it in the book.",
    text: "It solves tonight and becomes next week's problem.",
    choices: [
      choice("take-credit", "Put the basics on account", "You eat tonight and owe R90 on payday.", { stats: { happiness: 3 } }, { delayed: { days: 3, outcomeId: "spaza-debt", severity: 3, result: "Your R90 spaza account is due and has been charged.", effects: { cash: -90 } } }),
      choice("buy-less", "Buy only what cash covers", "Dinner is plain, but tomorrow owes you nothing.", { cash: -35, stats: { happiness: -2 } }),
      choice("cook-together", "Ask a neighbour to combine meals", "Two cupboards make one decent supper.", { cash: -20, stats: { social: 5 }, relationships: { neighbour: 5 } }),
    ],
  },
  {
    id: "rain-on-wash-day", deck: "owner", icon: "🌧️", kicker: "OWNER PROBLEM",
    title: "Rain arrives when the car-wash bookings do.",
    text: "Customers are already messaging. Nobody else owns the decision.",
    eligibility: { businessId: "car-wash" },
    choices: [
      choice("rain-discount", "Offer rain-check vouchers", "Today is weak, but customers remember the fairness.", { cash: -40, business: { trust: 7 } }),
      choice("push-through", "Wash under borrowed cover", "It is awkward, tiring and just profitable enough.", { cash: 90, stats: { energy: -10 }, business: { trust: 2 } }),
      choice("close-rain", "Close early", "You protect the equipment and lose the day's momentum.", { stats: { energy: 8 }, business: { trust: -3 } }),
    ],
  },
  {
    id: "customer-refund", deck: "owner", icon: "🧾", kicker: "YOUR NAME IS ON IT",
    title: "A customer says the job was not good enough.",
    text: "You remember the job differently. The customer has already opened their camera.",
    eligibility: { business: true },
    choices: [
      choice("redo-job", "Redo it yourself", "The complaint becomes a compliment, at the cost of your afternoon.", { stats: { energy: -9, reputation: 5 }, business: { trust: 8 } }),
      choice("partial-refund", "Offer a partial refund", "The customer leaves calmer. Your margin leaves too.", { cash: -100, business: { trust: 4 } }),
      choice("refuse-refund", "Stand by the original work", "You save the cash and inherit a public argument.", { business: { trust: -9 }, stats: { reputation: -5 } }),
    ],
  },
  {
    id: "office-credit", deck: "corporate", icon: "📊", kicker: "OFFICE POLITICS",
    title: "Your boss presents your idea as a team effort.",
    text: "The room applauds. Your name is missing.",
    eligibility: { career: true },
    choices: [
      choice("correct-room", "Correct the record now", "", {}, { followUp: {
        title: "The room goes quiet",
        text: "How hard do you press the point?",
        choices: [
          choice("credit-team", "Credit the team and name your part", "You claim your work without burning the room.", { career: { performance: 4, readiness: 6, boss: -2, coworkers: 4 }, stats: { reputation: 4 } }),
          choice("name-boss", "Say exactly what the boss did", "The truth lands. So does the silence afterwards.", { career: { performance: 2, readiness: 2, boss: -10 }, stats: { reputation: 3 } }),
        ],
      } }),
      choice("speak-later", "Raise it privately later", "You protect the meeting and test your boss's character.", { career: { boss: 3, readiness: 3 } }),
      choice("let-it-go", "Let the result speak eventually", "The team looks good. Your readiness barely moves.", { career: { coworkers: 3, readiness: -2 } }),
    ],
  },
  {
    id: "boss-lunch", deck: "corporate", icon: "🍽️", kicker: "CAREER MOMENT",
    title: "Your boss invites the team to lunch, then sits beside you.",
    text: "The conversation turns to loyalty, workload and who is ready for more.",
    eligibility: { career: true },
    choices: [
      choice("agree-boss", "Back the boss enthusiastically", "The boss enjoys the support. A co-worker notices the performance.", { career: { boss: 7, coworkers: -4, readiness: 2 } }),
      choice("ask-growth", "Ask what excellent work looks like", "You leave with a harder target and useful clarity.", { career: { boss: 3, readiness: 6 }, stats: { knowledge: 3 } }),
      choice("keep-light", "Keep the conversation light", "Nobody is offended and nothing changes quickly.", { career: { boss: 1, coworkers: 1 } }),
    ],
  },
  {
    id: "phone-theft", deck: "chaos", icon: "📱", kicker: "HE IS RUNNING",
    title: "A hand takes your phone and disappears into the crowd.",
    text: "The thief looks back once. The street between you is already moving.",
    choices: [
      choice("chase-phone", "Catch the thief", "Tap the masked thief eight times before the timer runs out.", {}, { minigame: "chase" }),
      choice("shout-help", "Shout and point", "People turn, but the thief knows the gaps.", { stats: { social: 2, happiness: -6 }, flags: { phoneLost: true } }),
      choice("protect-yourself", "Let the phone go", "It hurts, but you do not gamble your body.", { stats: { health: 2, happiness: -8 }, flags: { phoneLost: true } }),
    ],
  },
  {
    id: "sneaker-drop", deck: "money", icon: "👟", kicker: "WANT VS WEALTH",
    title: "The limited pair is finally in your size.",
    text: "The queue is short. Your savings goal suddenly feels very far away.",
    choices: [
      choice("buy-sneakers", "Buy them now", "The mirror approves. Your balance has questions.", { cash: -650, stats: { happiness: 8, reputation: 3 } }),
      choice("walk-away", "Keep the money", "The wanting fades slower than the pride.", { stats: { knowledge: 3, happiness: -2 } }),
      choice("resell-plan", "Study the resale price first", "You discover hype is not the same as profit.", { stats: { knowledge: 6 } }),
    ],
  },
  {
    id: "neighbour-move", deck: "community", icon: "📦", kicker: "A BAKKIE IS LATE",
    title: "A neighbour is moving and the promised help has not arrived.",
    text: "There is a couch on the pavement and rain in the distance.",
    choices: [
      choice("carry-couch", "Help carry everything", "Your back complains. The neighbourhood remembers.", { stats: { energy: -10, reputation: 7 }, relationships: { neighbour: 9 } }),
      choice("find-driver", "Phone someone with a vehicle", "A contact solves what muscles could not.", { cash: -60, stats: { social: 5 }, relationships: { neighbour: 5 } }),
      choice("lend-trolley", "Lend equipment and return to work", "You help without losing the whole day.", { stats: { reputation: 3 }, relationships: { neighbour: 3 } }),
    ],
  },
  {
    id: "street-opportunity", deck: "opportunity", icon: "🪧", kicker: "NEW OPENING",
    title: "A busy corner needs a reliable service.",
    text: "The opportunity is small today and much larger if somebody stays consistent.",
    eligibility: { weekend: true },
    choices: [
      choice("ask-numbers", "Ask what the numbers look like", "You get facts before excitement.", { stats: { knowledge: 6, reputation: 2 } }),
      choice("test-weekend", "Do a paid weekend trial", "You complete a small service job and the customer pays R80.", { cash: 80, stats: { energy: -6, reputation: 4 } }),
      choice("save-contact", "Save the contact for later", "The door stays open without becoming today's problem.", { stats: { social: 2 } }),
    ],
  },
]);

export const WORK_DECISIONS = Object.freeze([
  ...STORY_WORK_DECISIONS,
  { id: "career-boundaries", path: "career", topic: "workload", title: "Messages arrive after your shift", choices: [
    choice("set-boundary", "Reply with a plan for tomorrow", "You are clear about when the work will be done.", { career: { readiness: 4 }, stats: { energy: 4 } }),
    choice("stay-online", "Stay online to sort it out", "The task gets done, but your evening disappears.", { career: { boss: 3, performance: 2 }, stats: { energy: -8, happiness: -3 } }),
  ] },
  { id: "career-training", path: "career", topic: "initiative", title: "A new starter needs a walkthrough", choices: [
    choice("train-starter", "Show them and leave useful notes", "They can work independently tomorrow.", { career: { coworkers: 5, readiness: 4 }, stats: { energy: -5 } }),
    choice("send-guide", "Send the guide and finish your tasks", "Your deadline survives. They still have questions.", { career: { performance: 2, coworkers: -1 } }),
  ] },
  { id: "owner-booking", path: "business", topic: "service", title: "Two customers want the same time slot", choices: [
    choice("honest-booking", "Offer realistic times", "One waits until tomorrow. Both know what to expect.", { business: { trust: 5 }, stats: { knowledge: 2 } }),
    choice("overbook", "Promise both you can fit them in", "One order waits and a customer complains.", { business: { trust: -6 }, stats: { energy: -7 } }),
  ] },
  { id: "owner-books", path: "business", topic: "pricing", title: "Your cashbook does not match the receipts", choices: [
    choice("reconcile", "Check each receipt before closing", "You find a recording error. Learning the true numbers takes time, not a cash reward.", { stats: { knowledge: 5, energy: -5 } }),
    choice("guess", "Estimate it and leave", "Tonight is easier. Tomorrow's decisions use unreliable numbers.", { stats: { energy: 3 }, business: { trust: -3 } }),
  ] },
  { id: "career-quality", path: "career", topic: "quality", title: "The rushed report", choices: [
    choice("check", "Check every figure", "The report is late and correct.", { career: { performance: 6, readiness: 5 }, stats: { energy: -5 } }),
    choice("send", "Send it before the deadline", "Speed wins today. Two errors remain.", { career: { performance: -4, readiness: -2 } }, { risk: { severity: 35, communication: -6 } }),
  ] },
  { id: "career-honesty", path: "career", topic: "honesty", title: "A mistake nobody saw", choices: [
    choice("own", "Own the mistake", "The fix is uncomfortable and credible.", { career: { performance: 2, boss: 3, readiness: 5 } }),
    choice("hide", "Fix it quietly", "It disappears for now.", { career: { readiness: -4 } }, { risk: { severity: 52, communication: -16 }, delayed: { days: 2, outcomeId: "hidden-error", severity: 4, result: "The hidden error is found. Your boss loses trust.", effects: { career: { boss: -8, performance: -6 } } } }),
  ] },
  { id: "career-initiative", path: "career", topic: "initiative", title: "The process everyone hates", choices: [
    choice("prototype", "Build a small improvement", "The team saves time and remembers who started.", { career: { performance: 5, readiness: 7 }, stats: { knowledge: 4 } }),
    choice("complain", "Explain why it is broken", "The diagnosis is correct. The process remains.", { career: { performance: -1, coworkers: -2 } }, { risk: { severity: 26, communication: -8 } }),
  ] },
  { id: "career-teamwork", path: "career", topic: "teamwork", title: "A co-worker is drowning", choices: [
    choice("coach", "Help them finish", "The deadline survives through teamwork.", { career: { coworkers: 7, readiness: 4 }, stats: { energy: -6 } }),
    choice("protect", "Protect your own workload", "Your tasks shine alone.", { career: { performance: 3, coworkers: -5 } }),
  ] },
  { id: "career-workload", path: "career", topic: "workload", title: "One more urgent task", choices: [
    choice("negotiate", "Negotiate the priority", "You do less work and make it count.", { career: { boss: 2, readiness: 5 }, stats: { knowledge: 2 } }),
    choice("accept-all", "Say yes to everything", "The boss likes the answer. The work suffers.", { career: { boss: 5, performance: -5 }, stats: { energy: -10 } }, { risk: { severity: 30, communication: -4 } }),
  ] },
  { id: "career-politics", path: "career", topic: "politics", title: "The meeting before the meeting", choices: [
    choice("listen", "Listen without promising", "You learn the room without joining a camp.", { career: { readiness: 3, coworkers: 2 }, stats: { knowledge: 3 } }),
    choice("take-side", "Choose a side", "One relationship warms while another freezes.", { career: { boss: 4, coworkers: -6 } }, { risk: { severity: 38, communication: -10 } }),
  ] },
  { id: "career-boss", path: "career", topic: "boss", title: "The boss wants agreement", choices: [
    choice("flatter", "Tell the boss the plan is brilliant", "The praise lands better than the plan will.", { career: { boss: 6, readiness: -2, coworkers: -3 } }, { risk: { severity: 18, communication: 5 } }),
    choice("challenge", "Point out the risk", "The room gets tense. The risk gets fixed.", { career: { boss: -3, readiness: 6, performance: 4 } }),
  ] },
  { id: "owner-service", path: "business", topic: "service", title: "A customer arrives after closing", choices: [
    choice("serve", "Stay and help", "The late job becomes a loyal customer.", { cash: 80, business: { trust: 5 }, stats: { energy: -7 } }),
    choice("close", "Protect your closing time", "Your evening survives. The customer finds someone else.", { business: { trust: -2 }, stats: { energy: 4 } }),
  ] },
  { id: "owner-pricing", path: "business", topic: "pricing", title: "A competitor undercuts you", choices: [
    choice("quality", "Explain your value", "Fewer customers choose you, but better ones stay.", { business: { trust: 4 } }),
    choice("undercut", "Drop below their price", "The discount costs you R50 on today's orders. More customers do not always mean more profit.", { cash: -50, business: { trust: -2 } }),
  ] },
  { id: "owner-stock", path: "business", topic: "stock", title: "Cheap stock becomes available", eligibility: { businessId: "buy-resell" }, choices: [
    choice("inspect", "Inspect before buying", "You reject half and protect your name.", { cash: -70, business: { trust: 3 } }),
    choice("bulk", "Buy the whole lot", "You spend R160 on stock. Selling it is still work, and the quality is uncertain.", { cash: -160, business: { trust: -7 } }),
  ] },
  { id: "owner-late-job", path: "business", topic: "deadline", title: "A big job is running late", choices: [
    choice("call", "Call the customer now", "The delay is disappointing, not surprising.", { business: { trust: 3 } }),
    choice("hope", "Push silently and hope", "The job finishes after the angry call.", { business: { trust: -6 }, stats: { energy: -5 } }),
  ] },
  { id: "owner-helper", path: "business", topic: "staff", title: "A helper makes a costly mistake", eligibility: { business: true, minStaff: 1 }, choices: [
    choice("teach", "Teach and redo it together", "The cost hurts. The employee improves.", { cash: -90, business: { trust: 3 }, stats: { energy: -5 } }),
    choice("blame", "Blame them in front of the customer", "The customer gets an answer. The team gets a warning.", { business: { trust: -2 }, stats: { reputation: -4 } }),
  ] },
  { id: "owner-supplier", path: "business", topic: "supplier", title: "A supplier asks for trust", choices: [
    choice("small-order", "Test a small order", "The risk stays small and the data becomes useful.", { cash: -80, stats: { knowledge: 3 } }),
    choice("full-order", "Commit for the discount", "The price is good. Delivery is now somebody else's promise.", { cash: -220 }, { delayed: { days: 2, outcomeId: "supplier-delivery", severity: 3, result: "Your order arrives; the next customer jobs have stock ready.", effects: { business: { trust: 4 } } } }),
  ] },
  { id: "owner-equipment", path: "business", topic: "equipment", title: "Equipment fails mid-job", choices: [
    choice("repair", "Pay for a proper repair", "The day costs money and tomorrow stays possible.", { cash: -140, business: { trust: 2 } }),
    choice("improvise", "Improvise to finish", "You finish slowly. The payment is part of today's normal sales.", { stats: { energy: -9 }, business: { trust: -1 } }),
  ] },
]);

export function isEventEligible(event, state) {
  const rule = event.eligibility || {};
  if (event.id === "stokvel-pressure") {
    const cycle = Math.floor((state.calendar.day - 1) / 365);
    const month = Math.floor(((state.calendar.day - 1) % 365) * 12 / 365);
    if ((state.stokvel?.contributions || []).filter(item => item.cycle === cycle && item.month === month).reduce((sum,item)=>sum+item.amount,0) >= 180) return false;
  }
  if (rule.minAge && state.calendar.age < rule.minAge) return false;
  if (rule.maxAge && state.calendar.age > rule.maxAge) return false;
  if (rule.minStaff && state.business.staff.length < rule.minStaff) return false;
  if (rule.career && !state.career.active) return false;
  if (rule.business && !state.business.active) return false;
  if (rule.businessId && state.business.id !== rule.businessId) return false;
  if (rule.weekend && ![6, 7].includes(state.calendar.weekday)) return false;
  if (rule.travel && state.dailyState.phase !== "travel" && !state.dailyState.needsTravel) return false;
  return true;
}

export function getEventById(id) {
  return EVENTS.find((event) => event.id === id) || null;
}
