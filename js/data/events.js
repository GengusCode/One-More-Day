const choice = (id, label, result, effects = {}, extra = {}) => ({ id, label, result, effects, ...extra });

export const EVENTS = Object.freeze([
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
    title: "The stokvel contribution is due before payday.",
    text: "Skipping saves cash now, but everybody notices who carries the group.",
    choices: [
      choice("pay-stokvel", "Make the contribution", "", {}, { followUp: {
        title: "Your cash is tight",
        text: "Do you use savings or make a smaller honest offer?",
        choices: [
          choice("full-stokvel", "Pay the full amount", "The group knows your word means something.", { cash: -180, stats: { reputation: 6, happiness: 2 }, relationships: { friend: 5 } }),
          choice("partial-stokvel", "Explain and pay part", "Honesty keeps the relationship warmer than silence would.", { cash: -80, stats: { reputation: 2 }, relationships: { friend: 2 } }),
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
      choice("help-gogo", "Go help properly", "You lose an afternoon and gain a full plate.", { cash: -70, stats: { energy: -8, happiness: 6, reputation: 5 }, relationships: { gogo: 10 } }),
      choice("send-groceries", "Pay for delivery", "The groceries arrive before your apology does.", { cash: -120, relationships: { gogo: 3 } }),
      choice("promise-later", "Promise to come tomorrow", "Tomorrow now has an appointment.", { relationships: { gogo: -3 } }, { delayed: { days: 1, outcomeId: "gogo-reminder", severity: 2 } }),
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
      choice("take-credit", "Put the basics on account", "You eat tonight and owe R90 on payday.", { stats: { happiness: 3 } }, { delayed: { days: 3, outcomeId: "spaza-debt", severity: 3, effects: { cash: -90 } } }),
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
    text: "Your helper disagrees. The customer has already opened their camera.",
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
      choice("chase-phone", "Run after him", "", {}, { followUp: {
        title: "You commit to the chase",
        text: "Stay in the safe lane. One collision and he is gone.",
        choices: [
          choice("start-chase", "CHASE", "The street becomes a three-lane test.", {}, { minigame: "chase" }),
          choice("stop-chase", "Stop before it gets dangerous", "You keep yourself safe and report the phone.", { stats: { happiness: -9 }, flags: { phoneLost: true } }),
        ],
      } }),
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
    choices: [
      choice("ask-numbers", "Ask what the numbers look like", "You get facts before excitement.", { stats: { knowledge: 6, reputation: 2 } }),
      choice("test-weekend", "Offer a weekend trial", "A low-risk test earns a few real customers.", { cash: 80, stats: { energy: -6, reputation: 4 } }),
      choice("save-contact", "Save the contact for later", "The door stays open without becoming today's problem.", { stats: { social: 2 } }),
    ],
  },
]);

export const WORK_DECISIONS = Object.freeze([
  { id: "career-quality", path: "career", topic: "quality", title: "The rushed report", choices: [
    choice("check", "Check every figure", "The report is late and correct.", { career: { performance: 6, readiness: 5 }, stats: { energy: -5 } }),
    choice("send", "Send it before the deadline", "Speed wins today. Two errors remain.", { career: { performance: -4, readiness: -2 } }, { risk: { severity: 35, communication: -6 } }),
  ] },
  { id: "career-honesty", path: "career", topic: "honesty", title: "A mistake nobody saw", choices: [
    choice("own", "Own the mistake", "The fix is uncomfortable and credible.", { career: { performance: 2, boss: 3, readiness: 5 } }),
    choice("hide", "Fix it quietly", "It disappears for now.", { career: { readiness: -4 } }, { risk: { severity: 52, communication: -16 }, delayed: { days: 2, outcomeId: "hidden-error", severity: 4 } }),
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
    choice("undercut", "Drop below their price", "Demand rises and the margin disappears.", { cash: 50, business: { trust: -2 } }),
  ] },
  { id: "owner-stock", path: "business", topic: "stock", title: "Cheap stock becomes available", choices: [
    choice("inspect", "Inspect before buying", "You reject half and protect your name.", { cash: -70, business: { trust: 3 } }),
    choice("bulk", "Buy the whole lot", "The margin looks excellent until complaints begin.", { cash: 160, business: { trust: -7 } }),
  ] },
  { id: "owner-late-job", path: "business", topic: "deadline", title: "A big job is running late", choices: [
    choice("call", "Call the customer now", "The delay is disappointing, not surprising.", { business: { trust: 3 } }),
    choice("hope", "Push silently and hope", "The job finishes after the angry call.", { business: { trust: -6 }, stats: { energy: -5 } }),
  ] },
  { id: "owner-helper", path: "business", topic: "staff", title: "A helper makes a costly mistake", choices: [
    choice("teach", "Teach and redo it together", "The cost hurts. The employee improves.", { cash: -90, business: { trust: 3 }, stats: { energy: -5 } }),
    choice("blame", "Blame them in front of the customer", "The customer gets an answer. The team gets a warning.", { business: { trust: -2 }, stats: { reputation: -4 } }),
  ] },
  { id: "owner-supplier", path: "business", topic: "supplier", title: "A supplier asks for trust", choices: [
    choice("small-order", "Test a small order", "The risk stays small and the data becomes useful.", { cash: -80, stats: { knowledge: 3 } }),
    choice("full-order", "Commit for the discount", "The price is good. Delivery is now somebody else's promise.", { cash: -220 }, { delayed: { days: 2, outcomeId: "supplier-delivery", severity: 3 } }),
  ] },
  { id: "owner-equipment", path: "business", topic: "equipment", title: "Equipment fails mid-job", choices: [
    choice("repair", "Pay for a proper repair", "The day costs money and tomorrow stays possible.", { cash: -140, business: { trust: 2 } }),
    choice("improvise", "Improvise to finish", "You finish, slowly and loudly.", { cash: 60, stats: { energy: -9 }, business: { trust: -1 } }),
  ] },
]);

export function isEventEligible(event, state) {
  const rule = event.eligibility || {};
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
