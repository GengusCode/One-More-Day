const q = (id, text, answers, correct) => ({ id, text, choices: answers.map((label,index)=>({id:['a','b','c','d'][index],label})), correct });
export const ENTRANCE_QUESTIONS = Object.freeze([
 q('change','You pay R100 for three items costing R20 each. What change should you receive?',['R20','R30','R40','R60'],'c'),
 q('discount','A R200 item has a 10% discount. How much is the discount?',['R10','R20','R40','R180'],'b'),
 q('sequence','What comes next: 2, 4, 8, 16, …?',['18','24','30','32'],'d'),
 q('time','A meeting starts at 09:30 and lasts 45 minutes. When does it finish?',['10:15','10:30','09:45','11:15'],'a'),
 q('budget','You have R150. Food costs R75, electricity R40 and transport R30. What remains?',['R15','R5','R25','R35'],'b'),
 q('logic','Every bus is a vehicle. Which statement must be true?',['Every vehicle is a bus','No bus is a vehicle','A bus is a vehicle','Every bus is a car'],'c'),
 q('reading','A parcel says “Fragile: handle with care”. What should you do?',['Throw it onto a shelf','Stack heavy boxes on it','Open it without permission','Move it gently'],'d'),
 q('average','You earn R60, R90 and R120 over three shifts. What is the average per shift?',['R90','R80','R100','R270'],'a'),
 q('fraction','What is one quarter of 80?',['10','20','30','40'],'b'),
 q('bus-fare','Four taxi trips cost R30 each. What is the total?',['R60','R90','R120','R150'],'c'),
 q('hourly-pay','You earn R25 per hour for four hours. What do you earn?',['R75','R100','R125','R150'],'b'),
 q('sale-price','An item costs R150 before a R30 discount. What is its new price?',['R120','R130','R150','R180'],'a'),
 q('half-hour','How many minutes are in two and a half hours?',['90','120','150','180'],'c'),
 q('pattern-three','What comes next: 3, 6, 9, 12, …?',['13','14','15','18'],'c'),
 q('pattern-square','What comes next: 1, 4, 9, 16, …?',['20','25','32','36'],'b'),
 q('units','How many centimetres are in one metre?',['10','50','100','1000'],'c'),
 q('stock','A shelf has 24 bottles. You sell 9. How many remain?',['13','14','15','16'],'c'),
 q('profit','You buy an item for R80 and sell it for R110. What is the profit before other costs?',['R20','R30','R80','R190'],'b'),
 q('lunch-budget','You have R70 and buy lunch for R45. How much remains?',['R15','R20','R25','R30'],'c'),
 q('clock','It is 14:20. Your bus arrives in 25 minutes. What time is that?',['14:35','14:40','14:45','15:05'],'c'),
 q('weekly-saving','You save R50 each week. How much is saved after six weeks?',['R200','R250','R300','R350'],'c'),
 q('percentage','What is 50% of R90?',['R30','R40','R45','R50'],'c'),
 q('total-stock','You have three boxes containing eight items each. How many items is that?',['11','16','24','32'],'c'),
 q('multiplication','What is 7 multiplied by 6?',['36','40','42','48'],'c'),
 q('division','Thirty-six items are shared equally among four people. How many does each receive?',['6','8','9','12'],'c'),
 q('distance','You walk 2 km to work and 2 km home. What distance do you walk in five workdays?',['10 km','15 km','20 km','25 km'],'c'),
 q('priority','A notice says: “Applications close at 16:00 on Friday.” Which submission is on time?',['Friday at 16:30','Friday at 15:00','Saturday at 09:00','The following Monday'],'b'),
 q('instructions','A form says “Write your surname first”. Which is correct for Naledi Dube?',['Naledi Dube','Dube Naledi','Naledi only','Your phone number'],'b'),
 q('receipt','A receipt lists R40, R25 and R15. What should the total be?',['R65','R70','R75','R80'],'d'),
 q('date','Which date comes immediately after 30 April?',['31 April','1 May','1 June','29 April'],'b'),
 q('logic-tools','All spanners are tools. Which statement must be true?',['Every tool is a spanner','A spanner is a tool','No spanner is a tool','Every tool is metal'],'b'),
 q('logic-rain','The notice says the match is cancelled if it rains. It is raining. What follows?',['The match starts early','The match is cancelled','The notice is false','The match moves indoors'],'b'),
 q('ordering','Which number is smallest?',['0.5','0.25','0.75','1.0'],'b'),
 q('measure','A container holds 2 litres. How many 500 ml bottles fill it?',['2','3','4','5'],'c'),
 q('work-time','You start at 08:00 and finish at 12:00 with no break. How many hours is that?',['3','4','5','6'],'b'),
 q('refund','You paid R120 and receive a refund of half the amount. How much is refunded?',['R30','R40','R60','R120'],'c'),
 q('balance','Your balance is R200. You deposit R50, then spend R80. What remains?',['R150','R170','R180','R230'],'b'),
 q('delivery','A message says “Collect after 10:00”. Which collection time follows the instruction?',['09:00','09:30','09:45','10:30'],'d'),
 q('schedule','A shop opens at 09:00 and closes at 17:00. How long is it open?',['6 hours','7 hours','8 hours','9 hours'],'c'),
 q('average-two','Two shifts pay R80 and R120. What is their average pay?',['R80','R90','R100','R200'],'c'),

]);
export function createEntranceQuiz(random = Math.random, previousIds = []) {
 const available = ENTRANCE_QUESTIONS.filter(question=>!previousIds.includes(question.id));
 const order = (available.length>=8?available:ENTRANCE_QUESTIONS).map(question=>question.id);
 for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const selected=order.slice(0,8);
 const choiceOrders=Object.fromEntries(selected.map(id=>{const choices=["a","b","c","d"];for(let i=3;i>0;i--){const j=Math.floor(random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}return [id,choices];}));
 return {order:selected,choiceOrders,answers:[],index:0,deadline:Date.now()+30000};
}
