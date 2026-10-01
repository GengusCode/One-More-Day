const next = (eventId, minDays = 2, maxDays = 4) => ({ nextActivity: { eventId, minDays, maxDays } });
const choice = (id, label, result, effects = {}, extra = {}) => ({id, label, result, effects, ...extra});

// Follow-up cards are only drawn after a choice schedules them.
export const ROUTINE_EVENTS = [
  {id:'customer-enquiry',deck:'owner',icon:'📋',kicker:'CUSTOMER ENQUIRY',eligibility:{business:true},
    title:'A customer asks you to book a job for later this week.',text:'Check the scope before promising a price or a date.',choices:[
      choice('book-job','Confirm the scope and book a slot','You agree on a realistic booking. Payment will come from completing the work.',{business:{trust:2}},next('customer-booked-job',2,3)),
      choice('decline-job','Explain that you cannot fit it in','You keep your current commitments instead of overbooking.',{stats:{reputation:1}}),
      choice('refer-job','Suggest another reliable service','You help the customer find someone available.',{business:{trust:1},stats:{social:2}}),
    ]},
  {id:'customer-booked-job',deck:'owner',followUpOnly:true,icon:'🧰',kicker:'BOOKED WORK',eligibility:{business:true},
    title:'The customer you booked is expecting you today.',text:'Keep the appointment or explain the change before they have to chase you.',choices:[
      choice('complete-booking','Complete the agreed work carefully','You finish the booked work. Its payment is included in today’s business sales.',{stats:{energy:-6},business:{trust:3}},next('customer-booking-feedback',2,5)),
      choice('reschedule-booking','Call and agree on a new date','You explain the delay and agree on another slot.',{business:{trust:-1}},next('customer-booked-job',3,5)),
      choice('miss-booking','Ignore the appointment','The customer loses a day waiting for you.',{business:{trust:-7},stats:{reputation:-3}}),
    ]},
  {id:'customer-booking-feedback',deck:'owner',followUpOnly:true,icon:'⭐',kicker:'AFTER THE JOB',eligibility:{business:true},
    title:'The customer you served recommends you to a neighbour.',text:'The recommendation is an opportunity, not guaranteed income.',choices:[
      choice('quote-referral','Ask what they need and send a clear quote','You turn the recommendation into another properly scoped enquiry.',{business:{trust:2}},next('customer-booked-job',3,6)),
      choice('thank-customer','Thank them and keep your current schedule','The relationship improves without adding more work.',{business:{trust:3}}),
    ]},
  {id:'work-project-plan',deck:'corporate',icon:'🗂️',kicker:'THIS WEEK AT WORK',eligibility:{career:true},
    title:'Your team starts a small project with a review later this week.',text:'The plan you make today will shape what you can show at the review.',choices:[
      choice('plan-project','Write a realistic plan and divide the tasks','You set clear milestones for the review.',{career:{readiness:3},stats:{energy:-4}},next('work-project-review',3,5)),
      choice('decline-project','Explain that your current workload is full','You protect the work already on your desk.',{career:{readiness:-1},stats:{energy:3}}),
    ]},
  {id:'work-project-review',deck:'corporate',followUpOnly:true,icon:'🖥️',kicker:'PROJECT REVIEW',eligibility:{career:true},
    title:'It is time to review the project you planned.',text:'Your milestones give the team something concrete to check.',choices:[
      choice('show-progress','Show the progress and explain what remains','Your honest review helps the team finish the remaining work.',{career:{performance:4,readiness:3},stats:{knowledge:2}}),
      choice('claim-finished','Claim everything is finished without checking','The team discovers the unfinished tasks after your report.',{career:{performance:-5,boss:-4},stats:{reputation:-3}}),
    ]},
  {id:'home-repair-plan',deck:'community',icon:'🔧',kicker:'HOME MAINTENANCE',
    title:'A loose cupboard door needs attention.',text:'It still works, but leaving it loose will not fix it.',choices:[
      choice('arrange-repair','Arrange to fix it on your next free day','You make a small plan instead of waiting for it to break.',{},next('home-repair-day',2,4)),
      choice('tighten-door','Spend a little time tightening the screws','You solve the small problem before it grows.',{stats:{energy:-4,knowledge:2}}),
      choice('leave-door','Leave it for now','The loose door stays on your list.',{stats:{happiness:-1}}),
    ]},
  {id:'home-repair-day',deck:'community',followUpOnly:true,icon:'🪛',kicker:'KEEPING YOUR PLAN',
    title:'You set aside time to fix the cupboard door.',text:'The simple repair is ready for your attention.',choices:[
      choice('repair-yourself','Follow a guide and repair it yourself','You finish the repair and learn a useful skill.',{stats:{energy:-6,knowledge:4,happiness:2}}),
      choice('pay-repair','Pay R40 for help','You spend R40 to finish the repair properly.',{cash:-40,stats:{happiness:3}}),
    ]},
  {id:'unexpected-refund',deck:'money',surprise:'good',icon:'🧾',kicker:'AN UNEXPECTED BREAK',
    title:'The electricity vendor refunds an earlier overcharge.',text:'An account correction returns R60 that was already yours.',choices:[
      choice('keep-refund','Keep it as a buffer','The R60 refund gives your budget a little breathing room.',{cash:60}),
      choice('use-refund','Put the refund toward electricity','The corrected R60 goes straight toward R60 of electricity. Your cash stays the same.',{stats:{happiness:2}}),
    ]},
  {id:'unexpected-lift',deck:'relationships',surprise:'good',icon:'🚗',kicker:'GOOD TIMING',
    title:'A friend is nearby and offers help with your errands.',text:'Their unexpected free time makes your day a little easier.',choices:[
      choice('accept-help','Accept and thank them','You finish sooner and keep some energy for yourself.',{stats:{energy:7,happiness:3},relationships:{friend:2}}),
      choice('keep-plans','Thank them and stick to your plan','You enjoy the friendly offer and keep your independence.',{stats:{social:2}}),
    ]},
];
