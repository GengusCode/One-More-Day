const choice = (id, label, result, effects = {}, delayed) => ({ id, label, result, effects, ...(delayed ? { delayed } : {}) });
const later = (outcomeId, min, max, result, effects, severity = 2) => ({ outcomeId, daysRange: [min, max], result, effects, severity, highImpact: true });

export const STORY_EVENTS = [
  { id: 'neighbour-school-run', deck: 'community', icon: '🎒', kicker: 'A SMALL FAVOUR', title: 'Your neighbour is stuck before the school run.', text: 'Their lift cancelled. You have a little time, but your own day is already full.', choices: [
    choice('help-lift', 'Walk the children to school', 'You give up your quiet morning and make sure they arrive safely.', { stats: { energy: -8, reputation: 3 }, relationships: { neighbour: 5 } }, later('neighbour-returns-favour', 5, 18, 'Your neighbour remembers the school run and takes an errand off your hands. You finally get some rest.', { stats: { energy: 10, happiness: 4 }, relationships: { neighbour: 3 } })),
    choice('arrange-lift', 'Help arrange another lift', 'A few calls solve the problem without taking your whole morning.', { stats: { social: 3, energy: -3 } }, later('neighbour-introduction', 7, 25, 'The neighbour introduces you to someone useful after remembering your help.', { stats: { knowledge: 4, social: 4 } })),
    choice('pay-fare', 'Pay R40 toward their taxi', 'They thank you and get the children moving.', { cash: -40, relationships: { neighbour: 4 } }, later('neighbour-repays', 3, 14, 'Your neighbour pays back the R40 taxi fare. They kept their word.', { cash: 40, relationships: { neighbour: 3 } })),
    choice('decline-kindly', 'Explain that you cannot help today', 'You keep your plans and answer honestly.', { stats: { energy: 3 }, relationships: { neighbour: -1 } }),
  ] },
  { id: 'borrowed-speaker', deck: 'relationships', icon: '🔊', kicker: 'BORROWED THINGS', title: 'A speaker you borrowed has stopped working.', text: 'It was fine before the party. Your friend asks when you will bring it back.', choices: [
    choice('admit-damage', 'Own up and pay R100 for a repair', 'The conversation is awkward, but the repair is arranged.', { cash: -100, relationships: { friend: 2 } }, later('speaker-honesty', 4, 20, 'Your friend remembers that you owned the speaker mistake. They trust you with a useful introduction.', { stats: { reputation: 4, social: 3 }, relationships: { friend: 4 } })),
    choice('hide-damage', 'Return it and say nothing', 'You avoid the repair bill for now.', { stats: { happiness: 1 } }, later('speaker-found-out', 3, 12, 'Your friend finds the speaker damage. You owe R160 for the repair and lose their trust.', { cash: -160, relationships: { friend: -12 }, stats: { reputation: -5 } }, 3)),
    choice('repair-together', 'Offer time and fix it together', 'You spend the evening testing cables and learning what broke.', { stats: { energy: -9, knowledge: 4 }, relationships: { friend: 3 } }, later('speaker-workshop', 6, 22, 'The friend you repaired the speaker with shares another practical skill.', { stats: { knowledge: 5, happiness: 3 } })),
    choice('replace-later', 'Agree to pay R120 when the replacement arrives', 'You make a clear agreement rather than pretending it is fine.', { relationships: { friend: 1 } }, later('speaker-replacement', 5, 15, 'The speaker replacement arrives. The agreed R120 payment is due.', { cash: -120, relationships: { friend: 2 } }, 3)),
  ] },
  { id: 'lost-wallet', deck: 'community', icon: '👛', kicker: 'NOBODY IS WATCHING', title: 'You find a wallet outside a shop.', text: 'There is R90 inside, a bank card and a phone number on a folded note.', choices: [
    choice('call-owner', 'Call the owner and return everything', 'A relieved stranger thanks you. You lose some time, not your conscience.', { stats: { energy: -4, reputation: 4 } }, later('wallet-owner-help', 8, 30, 'The wallet owner recognises you at a community event and helps you make a useful connection.', { stats: { social: 5, knowledge: 3, happiness: 3 } })),
    choice('shop-counter', 'Leave it with the shop manager', 'You log where you found it and get back to your day.', { stats: { reputation: 2 } }),
    choice('take-cash', 'Take the R90 and leave the wallet', 'You pocket money that was never yours.', { cash: 90, stats: { reputation: -2 } }, later('wallet-camera', 4, 18, 'The shop camera links you to the wallet. You repay R90 and word spreads.', { cash: -90, stats: { reputation: -9, happiness: -4 } }, 3)),
    choice('post-notice', 'Post a notice without sharing private details', 'Someone messages the shop to arrange collection.', { stats: { social: 2, energy: -2 } }, later('wallet-thanks', 3, 10, 'A thank-you message confirms the wallet reached its owner. A small good deed stayed with you.', { stats: { happiness: 5 } })),
  ] },
  { id: 'friend-small-loan', deck: 'money', icon: '🤝', kicker: 'MONEY AND FRIENDSHIP', title: 'A friend asks to borrow R80 until things settle.', text: 'They sound embarrassed. You can help, set a boundary, or offer another kind of support.', choices: [
    choice('lend-with-agreement', 'Lend R80 and agree on repayment', 'You put the agreement in a message and hope it stays simple.', { cash: -80, relationships: { friend: 3 } }, { ...later('friend-loan-repaid', 5, 24, '', {}), outcomes: [
      { result: 'Your friend repays the R80 loan and thanks you for the breathing room.', effects: { cash: 80, relationships: { friend: 4 } } },
      { result: 'Your friend can repay only R40 of the R80 loan so far. You appreciate the effort, but the shortfall hurts.', effects: { cash: 40, relationships: { friend: -2 }, stats: { happiness: -2 } } },
    ] }),
    choice('gift-less', 'Give R30 without expecting it back', 'A smaller gift fits what you can afford.', { cash: -30, relationships: { friend: 4 } }, later('friend-gift-support', 8, 28, 'Your friend remembers the R30 help and shows up when you need company.', { stats: { happiness: 6, social: 3 } })),
    choice('help-budget', 'Help them plan the next few days', 'Together you find something they can cut or postpone.', { stats: { knowledge: 3, energy: -5 }, relationships: { friend: 2 } }),
    choice('loan-boundary', 'Explain that lending would put you short', 'You keep the friendship honest without lending money you need.', { stats: { happiness: -1 }, relationships: { friend: 1 } }),
  ] },
  { id: 'community-cleanup', deck: 'community', icon: '🧹', kicker: 'YOUR STREET', title: 'Neighbours organise a street clean-up.', text: 'There are gloves, bags and plenty to do. Some people are already complaining in the group chat.', choices: [
    choice('join-cleanup', 'Work alongside the volunteers', 'A morning of hard work leaves the street cleaner.', { stats: { energy: -10, health: 2, reputation: 4 } }, later('cleanup-team-support', 7, 30, 'The clean-up volunteers return the favour and help sort out a problem outside your home.', { stats: { energy: 8, happiness: 5 } })),
    choice('buy-bags', 'Contribute R25 for bags and gloves', 'You cannot stay, but you help cover useful supplies.', { cash: -25, stats: { reputation: 2 } }, later('cleanup-invite', 5, 22, 'The clean-up organiser remembers your contribution and invites you into a helpful local group.', { stats: { social: 4 } })),
    choice('complain-online', 'Post that nobody ever does enough', 'The message gets attention while others keep working.', { stats: { social: 1 } }, later('cleanup-backlash', 2, 9, 'Your clean-up complaint circulates. People remember that you criticised the work without helping.', { stats: { reputation: -5 }, relationships: { neighbour: -4 } })),
    choice('take-rest', 'Thank them and use the morning to rest', 'You needed a break and say so without judging anyone.', { stats: { energy: 8, happiness: 2 } }),
  ] },
  { id: 'family-digital-help', deck: 'relationships', icon: '📱', kicker: 'FAMILY TECH SUPPORT', title: 'A relative needs help completing an online form.', text: 'They are worried about pressing the wrong button. Your evening plans can wait, or perhaps someone else can help.', choices: [
    choice('teach-patiently', 'Sit together and explain each step', 'It takes longer, but they finish the form themselves.', { stats: { energy: -6, knowledge: 2 }, relationships: { gogo: 5 } }, later('relative-returns-help', 6, 21, 'Your relative remembers the patient help with the form and prepares a meal for a difficult evening.', { stats: { energy: 8, happiness: 5 } })),
    choice('send-guide', 'Send a simple guide and check in', 'You leave instructions they can use again.', { stats: { knowledge: 3 }, relationships: { gogo: 2 } }, later('relative-new-confidence', 4, 16, 'Your relative uses the guide on another form. They proudly tell you they managed on their own.', { stats: { happiness: 4 }, relationships: { gogo: 3 } })),
    choice('rush-form', 'Rush through it without checking', 'You finish quickly and hope every number was right.', { stats: { energy: -2 } }, later('form-correction', 3, 13, 'An error in the rushed form needs correcting. You spend time undoing it and apologising.', { stats: { energy: -8, reputation: -3 }, relationships: { gogo: -3 } })),
    choice('recommend-helper', 'Find someone available to help properly', 'You arrange help and keep your existing commitment.', { stats: { social: 2 }, relationships: { gogo: 1 } }),
  ] },
  { id: 'skill-swap', deck: 'opportunity', icon: '🛠️', kicker: 'TIME FOR TIME', title: 'A neighbour offers to trade skills.', text: 'They can teach basic repairs if you help with their paperwork. No money needs to change hands.', choices: [
    choice('swap-skills', 'Spend an evening helping and learning', 'You both leave with something useful.', { stats: { energy: -8, knowledge: 5 }, relationships: { neighbour: 3 } }, later('repair-skill-pays-off', 10, 35, 'When a small fitting breaks, the neighbour helps you use the repair skill you learnt together.', { stats: { knowledge: 4, happiness: 4, energy: 3 } })),
    choice('share-contact', 'Introduce them to someone who needs their skill', 'A contact is useful even when you cannot join in.', { stats: { social: 3 } }, later('skill-contact-return', 7, 24, 'Your introduction is remembered. The neighbour connects you with someone who can help you learn.', { stats: { knowledge: 4, social: 2 } })),
    choice('overpromise', 'Promise to help, then skip the meeting', 'Your free evening survives. Their preparation goes to waste.', { stats: { energy: 6 } }, later('skill-promise-cost', 3, 15, 'The neighbour remembers being stood up. They are less willing to help when you ask.', { relationships: { neighbour: -7 }, stats: { reputation: -4 } })),
    choice('decline-swap', 'Say you are not ready to commit', 'A clear no is easier to plan around than a vague yes.', { stats: { energy: 3 } }),
  ] },
  { id: 'group-ticket-plan', deck: 'relationships', icon: '🎟️', kicker: 'PLANS WITH PEOPLE', title: 'Friends want you to reserve a place on a day trip.', text: 'A seat costs R60. The organiser needs an answer before booking transport.', choices: [
    choice('book-seat', 'Pay R60 and commit to the trip', 'Your place is booked.', { cash: -60 } , later('trip-day-arrives', 4, 20, 'The day trip you booked finally happens. Time with your friends lifts your mood.', { stats: { happiness: 8, social: 4, energy: -5 }, relationships: { friend: 3 } })),
    choice('organise-route', 'Help organise without reserving a seat', 'You help them plan while keeping your cash.', { stats: { knowledge: 2, energy: -3 } }, later('trip-organiser-thanks', 5, 18, 'The organiser thanks you for planning the route and offers help with your next errand.', { stats: { energy: 6, social: 2 } })),
    choice('reserve-unpaid', 'Ask them to hold a seat and do not pay', 'The organiser takes your word and books transport.', { stats: { happiness: 1 } }, later('trip-unpaid-seat', 3, 12, 'The organiser covered your unpaid seat. You owe R60 and the group is frustrated.', { cash: -60, relationships: { friend: -6 }, stats: { reputation: -3 } }, 3)),
    choice('decline-trip', 'Decline early so someone else can go', 'They fill the place. You keep a quiet day for yourself.', { stats: { energy: 5 }, relationships: { friend: 1 } }),
  ] },
];

export const STORY_WORK_DECISIONS = [
  {id:'career-handover',path:'career',topic:'planning',title:'The next shift needs a clear handover',choices:[
    choice('write-handover','Leave a short checklist with priorities','The next person starts with a clear plan.',{stats:{energy:-3},career:{coworkers:3,readiness:2}}),
    choice('talk-handover','Walk through the unfinished tasks together','A quick conversation catches a misunderstanding.',{stats:{energy:-4,social:2},career:{coworkers:4}}),
  ]},
  {id:'career-version-mixup',path:'career',topic:'quality',title:'Two versions of the same file are circulating',choices:[
    choice('label-version','Confirm the latest version and label it clearly','The team stops working from outdated numbers.',{stats:{knowledge:3,energy:-3},career:{performance:3}}),
    choice('compare-changes','Compare the changes with the author','You understand why the numbers changed before sharing them.',{stats:{knowledge:4,energy:-5},career:{coworkers:2}}),
  ]},
  {id:'career-meeting-agenda',path:'career',topic:'planning',title:'A meeting has no agenda and a full invite list',choices:[
    choice('ask-agenda','Ask what needs deciding before the meeting','A clearer agenda makes the discussion useful.',{stats:{knowledge:2},career:{readiness:3}}),
    choice('send-update','Send a written update on your part','Your colleagues get the facts without another long call.',{stats:{energy:3},career:{performance:2}}),
  ]},
  {id:'career-customer-question',path:'career',topic:'service',title:'A customer asks something outside your expertise',choices:[
    choice('find-expert','Find the right person and introduce them','The customer gets a reliable answer rather than a guess.',{stats:{energy:-3,social:2},career:{performance:3}}),
    choice('check-answer','Check the information and call back','You learn the answer and keep the promise to call.',{stats:{knowledge:3,energy:-4},career:{readiness:2}}),
  ]},
  {id:'career-practical-demo',path:'career',topic:'learning',title:'A colleague demonstrates a tool you rarely use',choices:[
    choice('try-example','Try a small example while they explain','Practice makes the unfamiliar tool less intimidating.',{stats:{knowledge:4,energy:-3},career:{readiness:2}}),
    choice('save-notes','Write down the steps for your next task','You leave with useful notes and finish your current work.',{stats:{knowledge:2},career:{performance:2}}),
  ]},
  {id:'career-shared-space',path:'career',topic:'teamwork',title:'Shared supplies are getting difficult to find',choices:[
    choice('organise-supplies','Label the shelves and tidy your section','Everyone wastes less time looking for basic supplies.',{stats:{energy:-4},career:{coworkers:3,readiness:2}}),
    choice('agree-system','Agree on a simple system with the team','The people using the supplies help decide where they belong.',{stats:{social:3,energy:-3},career:{coworkers:4}}),
  ]},
  { id: 'owner-staff-training', path: 'business', topic: 'staff', eligibility: { business: true, minStaff: 1 }, title: 'Your team asks for a practical training session', choices: [
    choice('coach-team', 'Spend time practising the tricky jobs together', 'You slow your own work to show the team a reliable method.', { stats: { energy: -7, knowledge: 2 } }, later('training-report', 3, 6, 'The team uses the method you practised. Fewer jobs need redoing and customers notice the care.', { business: { trust: 5 }, stats: { energy: 4 } })),
    choice('pay-training', 'Pay R180 for a short practical course', 'R180 covers training. There is no instant cash reward.', { cash: -180 }, later('course-report', 4, 8, 'The team returns from the course with a better checklist and handles difficult jobs more confidently.', { business: { trust: 7 }, stats: { knowledge: 3 } })),
    choice('skip-training', 'Keep everyone on orders for now', 'Today stays on schedule, but the skill gap remains.', { stats: { energy: 2 } }, later('training-gap', 3, 7, 'Without the requested practice, another job needs redoing. You spend time helping the team put it right.', { business: { trust: -3 }, stats: { energy: -6 } })),
  ] },
  { id: 'owner-team-disagreement', path: 'business', topic: 'staff', eligibility: { business: true, minStaff: 2 }, title: 'Two team members disagree about dividing the work', choices: [
    choice('hear-both', 'Hear both sides and agree on a clear rota', 'The conversation takes time. Everyone leaves knowing their responsibilities.', { stats: { energy: -5, knowledge: 2 } }, later('rota-report', 2, 5, 'The rota you agreed on makes handovers smoother. The team spends less time arguing and more time helping customers.', { business: { trust: 4 }, stats: { energy: 4 } })),
    choice('pick-side', 'Back one person without hearing the other', 'You end the argument quickly. One person feels dismissed.', { stats: { energy: 2 } }, later('team-friction', 2, 5, 'The unresolved disagreement returns during a busy shift. Customers wait while you sort out the handover.', { business: { trust: -5 }, stats: { energy: -5 } })),
    choice('write-roles', 'Write down the roles and check in tomorrow', 'A simple plan gives both people something concrete to follow.', { stats: { energy: -3 } }, later('roles-report', 2, 4, 'Your written roles help the team settle the disagreement without another long meeting.', { business: { trust: 3 }, stats: { knowledge: 2 } })),
  ] },
  { id: 'owner-manager-problem', path: 'business', topic: 'management', eligibility: { business: true, manager: true }, title: 'A customer complaint needs a decision during a busy shift', choices: [
    choice('delegate-plan', 'Ask your manager to inspect it and report back', 'You agree on what to check and let the manager lead the conversation.', { stats: { energy: 3 } }, later('manager-report', 2, 4, 'Your manager reports that the complaint was checked and resolved with a clear explanation. The customer accepts the solution.', { business: { trust: 4 }, stats: { knowledge: 2 } })),
    choice('handle-yourself', 'Inspect it and speak to the customer yourself', 'You take time away from your other work to understand the complaint.', { stats: { energy: -6 }, business: { trust: 2 } }, later('owner-report', 2, 4, 'The customer confirms that your explanation solved the complaint. Your manager uses it as an example for the team.', { business: { trust: 3 }, stats: { knowledge: 3 } })),
    choice('dismiss-complaint', 'Tell the team to ignore it and keep working', 'Orders keep moving while the complaint goes unanswered.', {}, later('complaint-escalates', 2, 4, 'The ignored customer shares the unanswered complaint. Your manager now has a harder conversation to handle.', { business: { trust: -8 }, stats: { reputation: -3 } }, 3)),
  ] },
  { id: 'owner-branch-booking', path: 'business', topic: 'expansion', eligibility: { business: true, minPremises: 1 }, title: 'Your expanded premises receive a larger group booking', choices: [
    choice('confirm-booking', 'Reserve the slot and buy R120 of extra supplies', 'You confirm the scope and spend R120 preparing. The R320 payment comes after the team completes the booking.', { cash: -120, stats: { energy: -3 } }, later('group-booking-paid', 2, 4, 'Your team completes the reserved group booking and the customer pays R320. The earlier R120 supplies leave R200 extra profit.', { cash: 320, business: { trust: 3 } })),
    choice('overpromise-booking', 'Promise more than the team can comfortably deliver', 'The customer expects a bigger service than your plan allows.', { stats: { energy: -2 } }, later('booking-redo', 2, 4, 'The oversized booking needs R100 of extra supplies and rework. No extra booking payment arrives, and the customer is disappointed.', { cash: -100, business: { trust: -6 }, stats: { energy: -5 } }, 3)),
    choice('decline-booking', 'Decline early and protect existing bookings', 'You keep the current workload manageable. No extra supplies or booking payment changes hands.', { stats: { energy: 3 }, business: { trust: 1 } }),
  ] },
  { id: 'career-credit', path: 'career', topic: 'teamwork', title: 'A colleague’s idea saves the project', choices: [
    choice('credit-colleague', 'Name the colleague in the update', 'You give credit where it belongs.', { career: { coworkers: 4 }, stats: { reputation: 2 } }, later('colleague-backs-you', 5, 20, 'The colleague you credited speaks up for your contribution in a later meeting.', { career: { boss: 4, readiness: 3 }, stats: { happiness: 3 } })),
    choice('claim-idea', 'Let the boss assume it was your idea', 'You enjoy the praise and leave the assumption uncorrected.', { career: { boss: 3 } }, later('idea-truth', 4, 18, 'The original notes reveal whose idea it was. Taking credit damages trust.', { career: { boss: -7, coworkers: -8 }, stats: { reputation: -4 } }, 3)),
    choice('shared-credit', 'Explain how the team developed it', 'You describe the work without making it a competition.', { career: { coworkers: 3, readiness: 2 } }),
  ] },
  { id: 'career-training', path: 'career', topic: 'learning', title: 'A new starter is falling behind', choices: [
    choice('coach-starter', 'Spend time showing them the process', 'Your own work slows down, but they learn properly.', { stats: { energy: -6 }, career: { coworkers: 3 } }, later('starter-covers-you', 8, 26, 'The person you trained handles a difficult task while you catch up. Your effort comes back to you.', { stats: { energy: 8 }, career: { performance: 4, coworkers: 3 } })),
    choice('write-checklist', 'Make a checklist they can reuse', 'You turn the common mistakes into clear steps.', { stats: { knowledge: 3, energy: -3 }, career: { readiness: 2 } }, later('checklist-recognition', 6, 22, 'Your checklist reduces mistakes across the team. The boss notices the improvement.', { career: { boss: 4, readiness: 3 } })),
    choice('mock-starter', 'Make a joke about their mistakes', 'A few people laugh. The new starter goes quiet.', { stats: { social: 1 } }, later('starter-complaint', 3, 14, 'The new starter reports the repeated joke. Your boss asks why you made learning harder.', { career: { boss: -5, coworkers: -5 }, stats: { reputation: -3 } }, 3)),
  ] },
  { id: 'owner-warranty', path: 'business', topic: 'service', title: 'A customer reports a problem after paying', choices: [
    choice('honour-repair', 'Spend R70 fixing the problem', 'You put your work right without arguing.', { cash: -70, business: { trust: 3 } }, later('customer-review', 5, 24, 'The customer remembers the repair and posts a helpful review. More people trust your business.', { business: { trust: 7 }, stats: { reputation: 3 } })),
    choice('check-first', 'Inspect it and explain what you can cover', 'You set a fair boundary after checking the facts.', { stats: { energy: -4 }, business: { trust: 2 } }, later('fair-warranty-word', 7, 20, 'The customer tells a neighbour that you handled the complaint fairly.', { business: { trust: 4 } })),
    choice('ignore-customer', 'Ignore the messages', 'You keep the R70 today and hope the complaint disappears.', {}, later('ignored-review', 3, 17, 'The ignored customer posts the unanswered messages. Your business loses trust.', { business: { trust: -10 }, stats: { reputation: -4 } }, 3)),
  ] },
  { id: 'owner-referral', path: 'business', topic: 'network', title: 'A job is outside your skill or equipment', choices: [
    choice('refer-honestly', 'Recommend another reliable business', 'You pass on a job you cannot do well.', { business: { trust: 2 } }, later('referral-returned', 8, 30, 'The business you referred a customer to returns the favour. A paid R90 job comes your way.', { cash: 90, stats: { energy: -5 }, business: { trust: 3 } })),
    choice('learn-first', 'Explain the limits and research the work', 'You protect your name while learning what would be needed.', { stats: { knowledge: 4, energy: -5 }, business: { trust: 1 } }),
    choice('promise-anyway', 'Promise you can handle it anyway', 'The customer believes you. The work is still beyond your setup.', {}, later('overpromised-refund', 4, 16, 'The job you overpromised needs redoing. You cover R120 of costs and lose trust.', { cash: -120, business: { trust: -8 } }, 3)),
  ] },
];
